// Reply history management
const MAX_HISTORY = 50;
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // 1 second base delay

// SYNC: Daily usage limit for free tier - must match across all files (background.js, popup.js, options.js)
const DAILY_LIMIT = 50;

// SYNC: Backend API base URL - must match across all files (background.js, options.js)
const API_BASE_URL = 'https://chat.sopie.cc';

// 注意：LICENSE_HMAC_SECRET 已移除 — 客户端密钥本就公开，HMAC 签名无安全价值
// 防重放改由服务端 timestamp 校验（5分钟窗口）保障

// Heartbeat detection constants
// 方案 D 收紧：6h → 1h，缓存 30min → 15min
const HEARTBEAT_INTERVAL_HOURS = 1;
const HEARTBEAT_CACHE_MINUTES = 15;

// License verification on extension startup
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Set default free license for new installations
    await chrome.storage.sync.set({ licenseType: 'free' });
  } else if (details.reason === 'update') {
    // Verify license on update
    await verifyLicenseOnStartup();
  }
});

// Verify license when extension starts (for subsequent loads)
chrome.runtime.onStartup.addListener(async () => {
  await verifyLicenseOnStartup();
});

// License verification function
async function verifyLicenseOnStartup() {
  try {
    // P1-15 修复:如果上次 forceLogout 失败,优先重试,不继续 license 检查
    if (pendingForceLogout) {
      await forceLogout(forceLogoutReason);
      return;
    }
    // P1-8 修复：licenseCode 改存 chrome.storage.local（敏感凭据不进 sync）
    const { licenseType } = await chrome.storage.sync.get(['licenseType']);
    const { licenseCode } = await chrome.storage.local.get(['licenseCode']);

    if (licenseCode) {
      // Cloud verification - call backend API
      try {
        const apiUrl = API_BASE_URL; // SYNC: must match options.js
        // Sanitize licenseCode to prevent URL injection
        const safeCode = encodeURIComponent(String(licenseCode).slice(0, 64));
        const response = await fetchWithRetry(`${apiUrl}/api/license/status/${safeCode}`, {}, 1); // P1-12 修复:retries=1,超时由全局 FETCH_TIMEOUT(30s)控制
        
        if (!response.ok) {
          // Server error (5xx) or unexpected status: don't downgrade, use local cache
          throw new Error(`License API returned HTTP ${response.status}`);
        }
        
        const status = await response.json();
        
        if (status.active) {
          console.log(`Cloud license verified: ${status.type} plan`);
          // Update local storage with cloud status
          await chrome.storage.sync.set({ 
            licenseType: status.type,
            licenseVerified: new Date().toISOString()
          });
        } else {
          // License invalid/expired, downgrade to free
          console.warn('License expired, downgrading to free');
          await chrome.storage.sync.set({
            licenseType: 'free',
            licenseInvalid: true
          });
          await chrome.storage.local.set({ licenseCode: null });
        }
      } catch (cloudError) {
        // Cloud verification failed, use local license
        console.warn('Cloud verification failed, using local:', cloudError.message);
        console.log(`Local license verified: ${licenseType} plan`);
      }
    } else {
      // No license found, set to free
      await chrome.storage.sync.set({ licenseType: 'free' });
    }
  } catch (error) {
    console.error('License verification failed:', error);
    // On error, default to free
    await chrome.storage.sync.set({ licenseType: 'free' });
  }

  // Trigger an initial heartbeat after startup verification
  sendHeartbeat().catch(err => console.warn('Initial heartbeat failed:', err.message));
}

// ================================
// Heartbeat Detection System
// ================================

// Register periodic heartbeat alarm (MV3-compatible)
chrome.alarms.create('licenseHeartbeat', {
  periodInMinutes: HEARTBEAT_INTERVAL_HOURS * 60
});

// Listen for alarm events
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'licenseHeartbeat') {
    sendHeartbeat().catch(err => console.warn('Heartbeat alarm failed:', err.message));
  }
});

// Send heartbeat to server — verifies fingerprint consistency
async function sendHeartbeat() {
  try {
    // P1-15 修复:如果上次 forceLogout 失败,优先重试,不继续心跳
    if (pendingForceLogout) {
      await forceLogout(forceLogoutReason);
      return;
    }
    // P1-8 修复：licenseCode 改存 chrome.storage.local
    const { licenseType } = await chrome.storage.sync.get(['licenseType']);
    const { licenseCode } = await chrome.storage.local.get(['licenseCode']);

    // Only heartbeat for activated (non-free) licenses
    if (!licenseCode || licenseType === 'free') {
      return;
    }

    // Throttle: skip if last heartbeat was within cache window
    const cacheData = await chrome.storage.local.get(['lastHeartbeatAt']);
    const lastAt = cacheData.lastHeartbeatAt ? new Date(cacheData.lastHeartbeatAt).getTime() : 0;
    const elapsedMin = (Date.now() - lastAt) / 60000;
    if (elapsedMin < HEARTBEAT_CACHE_MINUTES) {
      return; // Within cache window, skip
    }

    // Get device fingerprint (prefer cached, fallback to background generator)
    let fingerprint = null;
    const fpData = await chrome.storage.local.get(['deviceFingerprint']);
    if (fpData.deviceFingerprint) {
      fingerprint = fpData.deviceFingerprint;
    } else {
      fingerprint = await generateFingerprintInBackground();
      if (fingerprint) {
        await chrome.storage.local.set({ deviceFingerprint: fingerprint });
      }
    }

    if (!fingerprint) {
      console.warn('Heartbeat: no fingerprint available, skipping');
      return;
    }

    // 请求时间戳（服务端用于防重放校验）
    const timestamp = Date.now().toString();

    const response = await fetchWithRetry(`${API_BASE_URL}/api/license/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: licenseCode.toUpperCase(),
        fingerprint,
        timestamp
      })
    }, 2); // P1-12 修复:retries=2(心跳可重试),超时由全局 FETCH_TIMEOUT(30s)控制

    if (!response.ok) {
      console.warn(`Heartbeat HTTP ${response.status}, will retry next alarm`);
      return;
    }

    const result = await response.json();

    if (result.valid) {
      // Heartbeat success — cache timestamp
      await chrome.storage.local.set({ lastHeartbeatAt: new Date().toISOString() });
      console.log('Heartbeat OK');
    } else {
      // Fingerprint mismatch or license revoked — force logout
      console.warn('Heartbeat rejected:', result.reason || 'fingerprint mismatch');
      await forceLogout(result.reason || (chrome.i18n.getMessage('fingerprintMismatch') || 'Device fingerprint mismatch, you have been forced offline'));
    }
  } catch (err) {
    console.warn('Heartbeat error (network?), will retry next alarm:', err.message);
  }
}

// P1-15 修复:forceLogout 重试与持久化标志——失败后下次 license 检查时重试
let pendingForceLogout = false;
let forceLogoutReason = null;

// Force logout — downgrade to free and clear sensitive data
async function forceLogout(reason) {
  // 标记待强制登出(失败后下次 license 检查时会重试)
  pendingForceLogout = true;
  forceLogoutReason = reason;

  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Downgrade to free
      await chrome.storage.sync.set({
        licenseType: 'free',
        licenseInvalid: true
      });
      // P1-8 修复：licenseCode 改存 chrome.storage.local
      await chrome.storage.local.set({ licenseCode: null });

      // P1-4 修复：apiKey 已迁移到 local，清理 local 而非 sync
      await chrome.storage.local.remove(['apiKey', 'apiProvider']);

      // Clear local heartbeat cache
      await chrome.storage.local.remove(['lastHeartbeatAt']);

      // Notify all open tabs to refresh UI
      try {
        const tabs = await chrome.tabs.query({});
        for (const tab of tabs) {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, {
              action: 'LICENSE_REVOKED',
              reason: reason
            }).catch(() => { /* tab may not have listener */ });
          }
        }
      } catch (e) {
        // Ignore tab messaging errors
      }

      // Show desktop notification
      if (chrome.notifications) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: chrome.i18n.getMessage('licenseInvalidTitle') || 'License invalidated',
          message: reason || (chrome.i18n.getMessage('licenseInvalidMsg') || 'Your license has been activated on another device. This device has been logged out automatically.'),
          priority: 2
        });
      }

      // 成功,清除待重试标志
      pendingForceLogout = false;
      forceLogoutReason = null;
      console.warn('Force logout completed:', reason);
      return;
    } catch (err) {
      console.error(`Force logout attempt ${attempt} failed:`, err);
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000 * attempt)); // 指数退避
      }
    }
  }
  // 所有重试均失败:保留 pendingForceLogout=true,下次 license 检查时重试
  console.error('All force logout retries failed, will retry on next license check');
}

// Background fingerprint generator (fallback when options page hasn't cached one)
async function generateFingerprintInBackground() {
  try {
    // Service Worker has no DOM access — use navigator/screen info only
    const nav = self.navigator || {};
    const components = [
      nav.userAgent || '',
      nav.language || '',
      nav.languages ? nav.languages.join(',') : '',
      nav.platform || '',
      nav.hardwareConcurrency || 0,
      (nav.deviceMemory || 0).toString(),
      String(self.screen?.width || 0),
      String(self.screen?.height || 0),
      String(self.screen?.colorDepth || 0),
      new Date().getTimezoneOffset().toString(),
      Intl.DateTimeFormat().resolvedOptions().timeZone || ''
    ];
    const raw = components.join('|');
    // Simple SHA-256 via crypto.subtle
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
    const arr = Array.from(new Uint8Array(buf));
    return arr.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    console.warn('Background fingerprint generation failed:', e);
    return null;
  }
}

// Default fallback models configuration
const DEFAULT_FALLBACK_MODELS = [
  { name: 'gpt-3.5-turbo', apiUrl: 'https://api.openai.com/v1', enabled: true },
  { name: 'claude-3-haiku-20240307', apiUrl: 'https://api.anthropic.com/v1', enabled: false },
  { name: 'gemini-pro', apiUrl: 'https://generativelanguage.googleapis.com/v1', enabled: false }
];

// ================================
// Models Config Loader（一次性加载，全局缓存）
// ================================
let _modelsConfig = null;
async function getModelsConfig() {
  if (!_modelsConfig) {
    const resp = await fetch(chrome.runtime.getURL('models-config.json'));
    _modelsConfig = await resp.json();
  }
  return _modelsConfig;
}

// 根据 provider id 解析完整 API 配置（URL + 推荐模型）
async function resolveProviderConfig(providerId, apiKey) {
  const config = await getModelsConfig();
  const provider = (config.providers || []).find(p => p.id === providerId);
  if (!provider) return null;
  const recommendedModel = (provider.models || []).find(m => m.recommended)?.id
    || (provider.models || [])[0]?.id
    || 'gpt-3.5-turbo';
  return {
    apiUrl: provider.url,
    modelName: recommendedModel,
    apiKey: apiKey
  };
}

// 从 local storage 读取 API 配置，合并到 data 对象
async function loadApiSettings(data) {
  const localApi = await chrome.storage.local.get(['apiProvider', 'apiKey', 'apiUrl', 'modelName']);
  data.apiKey = localApi.apiKey || '';

  // 优先使用用户直接配置的 apiUrl / modelName（设置页自定义模型表单）
  // 仅当两者都存在时才视为自定义配置，避免半填状态被误用
  if (localApi.apiUrl && localApi.modelName) {
    data.apiUrl = localApi.apiUrl;
    data.modelName = localApi.modelName;
    data.provider = localApi.apiProvider || 'custom';
    return data;
  }

  // fallback: 从 models-config.json 解析（兼容 onboarding 预设选择）
  data.provider = localApi.apiProvider || 'openai';
  const resolved = await resolveProviderConfig(data.provider, data.apiKey);
  if (resolved) {
    data.apiUrl = resolved.apiUrl;
    data.modelName = resolved.modelName;
  } else {
    data.apiUrl = localApi.apiUrl || '';
    data.modelName = localApi.modelName || '';
  }
  return data;
}

// Build correct API endpoint based on provider URL pattern
function buildApiEndpoint(apiUrl) {
  const url = apiUrl.replace(/\/+$/, '');
  
  if (url.includes('api.anthropic.com')) {
    return url.endsWith('/messages') ? url : url + '/messages';
  } else if (url.includes('generativelanguage.googleapis.com')) {
    return (url.endsWith('/chat/completions') || url.endsWith('/generateContent')) ? url : url + '/chat/completions';
  } else {
    return (url.endsWith('/chat/completions') || url.endsWith('/messages')) ? url : url + '/chat/completions';
  }
}

// Build system instruction from settings (shared by generateReply and previewChat)
function buildSystemInstruction(data) {
  let instruction = 'You are a helpful assistant.';
  
  if (data.personas && data.activePersonaId) {
    const activePersona = data.personas.find(p => p.id === data.activePersonaId);
    if (activePersona && activePersona.prompt) {
      instruction = activePersona.prompt;
    }
  }
  
  if (data.tone && data.tone !== 'auto') {
    instruction += '\n\nPlease reply with a ' + data.tone + ' tone.';
  }
  
  instruction += '\n\nCRITICAL: Detect the language of the last message and reply in that SAME language automatically unless specified otherwise.';
  
  if (data.replyLength && data.replyLength !== 'auto') {
    const lengthMap = { short: '1-2 sentences', medium: '2-4 sentences', long: 'detailed' };
    instruction += '\n\nPlease provide a ' + lengthMap[data.replyLength] + ' response.';
  }
  
  if (data.faqData && data.faqData.length > 0) {
    instruction += '\n\nKnowledge Base (FAQ):\n' + data.faqData.map(f => 'Q: ' + f.q + '\nA: ' + f.a).join('\n---\n');
    instruction += '\n\nPlease use the above information to answer questions if relevant, but keep the conversation natural.';
  }
  
  return instruction;
}

const FETCH_TIMEOUT = 30000; // 30 second timeout per request

// Promise chain lock for daily usage counter (prevents race condition on concurrent requests)
let _dailyLimitLock = Promise.resolve();

// Fetch with retry, exponential backoff, and timeout control
async function fetchWithRetry(url, options, retries = MAX_RETRIES) {
  let lastError;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      // If rate limited (429), wait and retry
      if (response.status === 429 && attempt < retries - 1) {
        const retryAfter = response.headers.get('Retry-After');
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : RETRY_DELAY_BASE * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // For server errors (5xx), retry with backoff
      if (response.status >= 500 && attempt < retries - 1) {
        const delay = RETRY_DELAY_BASE * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Handle timeout specifically
      if (error.name === 'AbortError') {
        lastError = new Error(chrome.i18n.getMessage('requestTimeout', [String(FETCH_TIMEOUT / 1000)]) || `Request timeout (${FETCH_TIMEOUT / 1000}s). Please check your network connection.`);
      } else {
        lastError = error;
      }
      
      if (attempt < retries - 1) {
        const delay = RETRY_DELAY_BASE * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Request failed after ' + retries + ' retries');
}

// Try to generate reply with fallback models
async function generateWithFallback(settings, messages, fallbackModels) {
  const errors = [];
  const startTime = Date.now();
  
  // Try primary model first
  const primaryModel = settings.modelName || 'gpt-3.5-turbo';
  const primaryUrl = buildApiEndpoint(settings.apiUrl || 'https://api.openai.com/v1/chat/completions');
  
  try {
    const result = await tryGenerate(primaryUrl, settings.apiKey, primaryModel, messages);
    return { success: true, reply: result.reply, model: primaryModel, responseTime: Date.now() - startTime };
  } catch (error) {
    errors.push({ model: primaryModel, error: error.message });
    console.debug(`Primary model ${primaryModel} failed:`, error.message);
  }
  
  // Try fallback models
  if (fallbackModels && fallbackModels.length > 0) {
    for (const fallback of fallbackModels) {
      if (!fallback.enabled || !fallback.apiKey) continue;
      
      try {
        // Build correct API endpoint
        const fallbackUrl = buildApiEndpoint(fallback.apiUrl);
        const result = await tryGenerate(fallbackUrl, fallback.apiKey, fallback.name, messages);
        
        // Track fallback usage
        await trackFallbackUsage(primaryModel, fallback.name);
        
        return { 
          success: true, 
          reply: result.reply, 
          model: fallback.name, 
          isFallback: true,
          responseTime: Date.now() - startTime
        };
      } catch (error) {
        errors.push({ model: fallback.name, error: error.message });
        console.debug(`Fallback model ${fallback.name} failed:`, error.message);
      }
    }
  }
  
  // All models failed
  throw new Error(`All models failed. Errors: ${errors.map(e => `${e.model}: ${e.error}`).join('; ')}`);
}

// Try to generate with a specific model
async function tryGenerate(apiUrl, apiKey, modelName, messages) {
  // Chrome Web Store 合规：检查是否拥有该 API 域名的访问权限
  // service worker 无法 request 权限（需用户手势），只能 contains 检查
  try {
    const u = new URL(apiUrl);
    const origin = `${u.origin}/*`;
    if (!origin.includes('chat.sopie.cc')) {
      const hasPerm = await chrome.permissions.contains({ origins: [origin] });
      if (!hasPerm) {
        throw new Error(`PERMISSION_REQUIRED:${u.hostname}`);
      }
    }
  } catch (permErr) {
    if (permErr.message && permErr.message.startsWith('PERMISSION_REQUIRED:')) {
      const hostname = permErr.message.split(':')[1];
      // 通过通知提示用户去设置页授权
      if (chrome.notifications) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: chrome.i18n.getMessage('permRequiredTitle') || 'API domain authorization required',
          message: chrome.i18n.getMessage('permRequiredMsg', [hostname]) || `Please go to the extension settings page, click "Test Connection" to authorize ${hostname} and retry.`,
          priority: 2
        });
      }
      throw new Error(chrome.i18n.getMessage('permRequiredError', [hostname]) || `API domain ${hostname} is not authorized. Please go to the settings page and click "Test Connection" to complete authorization.`);
    }
    // URL 解析失败，继续尝试请求
  }

  const bodyData = {
    model: modelName,
    messages: messages
  };

  if (!modelName.startsWith('o1') && !modelName.startsWith('o3')) {
    bodyData.temperature = 0.7;
  }

  // Determine if this is Anthropic API (needs different auth and response format)
  const isAnthropic = apiUrl.includes('api.anthropic.com');
  
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (isAnthropic) {
    headers['x-api-key'] = apiKey.trim();
    headers['anthropic-version'] = '2023-06-01';
    // Anthropic uses 'messages' instead of 'messages' in body
    bodyData.messages = messages.map(m => ({
      role: m.role === 'system' ? 'user' : m.role,
      content: m.content
    }));
    // Move system message to separate field if present
    const systemMsg = messages.find(m => m.role === 'system');
    if (systemMsg) {
      bodyData.system = systemMsg.content;
      bodyData.messages = bodyData.messages.filter(m => m.role !== 'system');
    }
  } else {
    headers['Authorization'] = `Bearer ${apiKey.trim()}`;
  }

  const response = await fetchWithRetry(apiUrl, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(bodyData)
  }, 2); // Only 2 retries per model

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const serverMsg = errorData.error?.message || errorData.error?.code || errorData.message;
    throw new Error(serverMsg || `HTTP ${response.status}`);
  }

  const result = await response.json();
  let reply = 'No reply generated.';
  
  if (isAnthropic && result.content && result.content.length > 0) {
    // Anthropic response format
    reply = result.content[0].text || '';
  } else if (result.choices && result.choices.length > 0) {
    // OpenAI-compatible format
    reply = result.choices[0].message?.content || result.choices[0].text || '';
  } else if (result.content && result.content.length > 0) {
    reply = result.content[0].text || '';
  } else if (result.message && result.message.content) {
    reply = result.message.content;
  }
  
  return { reply: reply.trim() };
}

// Track fallback model usage
async function trackFallbackUsage(primaryModel, fallbackModel) {
  const stats = await chrome.storage.local.get({ fallbackUsage: {} });
  const fallbackUsage = stats.fallbackUsage || {};
  
  const key = `${primaryModel}_to_${fallbackModel}`;
  fallbackUsage[key] = (fallbackUsage[key] || 0) + 1;
  
  await chrome.storage.local.set({ fallbackUsage });
}

async function addToHistory(reply, context) {
  const safeContext = Array.isArray(context) ? context : [];
  const data = await chrome.storage.local.get({ replyHistory: [] });
  const history = data.replyHistory || [];
  
  history.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
    reply: reply,
    context: safeContext.slice(-3).map(m => (m.content || '').substring(0, 100)),
    timestamp: Date.now()
  });
  
  if (history.length > MAX_HISTORY) history.pop();
  
  await chrome.storage.local.set({ replyHistory: history });
  return history;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Use async wrapper for cleaner code
  const handleAsync = async () => {
    if (request.action === 'generateReply') {
      // Validate request.context is an array (defensive against malformed messages)
      const context = Array.isArray(request.context) ? request.context : [];
      
      const data = await chrome.storage.sync.get(['personas', 'activePersonaId', 'tone', 'replyLength', 'faqData', 'totalReplies', 'fallbackModels', 'fallbackEnabled', 'licenseType']);
      // P1-8 修复：licenseCode 改存 chrome.storage.local
      const { licenseCode } = await chrome.storage.local.get(['licenseCode']);
      data.licenseCode = licenseCode;
      await loadApiSettings(data);
      try {
        if (!data.apiKey) {
          throw new Error(chrome.i18n.getMessage('apiKeyNotConfigured') || 'Please configure the API Key first');
        }

        // Server-side license verification for Pro users (prevents client-side tampering)
        const localLicenseType = data.licenseType || 'free';
        let licenseType = localLicenseType;
        if (localLicenseType !== 'free' && data.licenseCode) {
          try {
            const localFpData = await chrome.storage.local.get(['deviceFingerprint']);
            // P0-1 兼容：verify-token 强制要求 fingerprint，缺失时生成并缓存
            let fingerprint = localFpData.deviceFingerprint;
            if (!fingerprint) {
              fingerprint = await generateFingerprintInBackground();
              if (fingerprint) {
                await chrome.storage.local.set({ deviceFingerprint: fingerprint });
              }
            }
            const verifyResponse = await fetchWithRetry(`${API_BASE_URL}/api/license/verify-token`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                licenseCode: data.licenseCode,
                fingerprint: fingerprint
              })
            }, 1); // P1-12 修复:retries=1(避免重试导致重复验证),超时由全局 FETCH_TIMEOUT(30s)控制
            if (verifyResponse.ok) {
              const verifyResult = await verifyResponse.json();
              if (!verifyResult.allowed) {
                // Server says license is invalid — downgrade and enforce free tier
                console.warn('Server rejected license, downgrading to free');
                await chrome.storage.sync.set({ licenseType: 'free', licenseInvalid: true });
                licenseType = 'free';
              } else {
                licenseType = verifyResult.type || localLicenseType;
                // Sync the verified type back to storage
                if (verifyResult.type !== localLicenseType) {
                  await chrome.storage.sync.set({ licenseType: verifyResult.type });
                }
              }
            }
            // If server is unreachable, fall back to local licenseType (graceful degradation)
          } catch (verifyErr) {
            console.warn('License verification failed, using local cache:', verifyErr.message);
          }
        }

        // Check daily usage limit for free users (atomic check + increment with lock)
        let dailyCountIncremented = false;
        if (licenseType === 'free') {
          await new Promise((resolve, reject) => {
            _dailyLimitLock = _dailyLimitLock.then(async () => {
              try {
                const dailyLimit = DAILY_LIMIT;
                const today = new Date().toISOString().split('T')[0];
                const usageData = await chrome.storage.local.get(['dailyReplyCount', 'lastResetDate']);
                
                // Reset counter if it's a new day
                let currentCount = usageData.dailyReplyCount || 0;
                if (usageData.lastResetDate !== today) {
                  currentCount = 0;
                }
                
                if (currentCount >= dailyLimit) {
                  throw new Error(chrome.i18n.getMessage('freeLimitExhausted', [String(dailyLimit)]) || `Free tier daily limit of ${dailyLimit} replies is exhausted. Upgrade to Pro for unlimited replies.`);
                }
                
                // Increment counter BEFORE API call to prevent race condition
                await chrome.storage.local.set({ 
                  dailyReplyCount: currentCount + 1,
                  lastResetDate: today 
                });
                dailyCountIncremented = true;
                resolve();
              } catch (err) {
                reject(err);
              }
            }).catch(() => {}); // M4 修复：防御性 catch，防止链断裂
          });
        }

        const systemInstruction = buildSystemInstruction(data);

        const messages = [
          { role: 'system', content: systemInstruction },
          ...context
        ];

        if (context.length === 0) {
          messages.push({ role: 'user', content: 'Hello! Please introduce yourself.' });
        }

        // Use fallback mechanism if enabled
        const fallbackEnabled = data.fallbackEnabled !== false; // Default to true
        let result;
        
        if (fallbackEnabled) {
          const fallbackModels = data.fallbackModels || DEFAULT_FALLBACK_MODELS.filter(m => m.enabled);
          result = await generateWithFallback(data, messages, fallbackModels);
        } else {
          // Use primary model only - via tryGenerate for unified provider handling
          const apiUrl = buildApiEndpoint(data.apiUrl || 'https://api.openai.com/v1/chat/completions');
          const startTime = Date.now();
          const genResult = await tryGenerate(apiUrl, data.apiKey, data.modelName || 'gpt-3.5-turbo', messages);
          const responseTime = Date.now() - startTime;
          result = { success: true, reply: genResult.reply, model: data.modelName || 'gpt-3.5-turbo', responseTime };
        }
        
        // Save to history
        await addToHistory(result.reply, context);
        
        // Daily usage counter already incremented above (optimistic)
        
        // Update statistics
        const stats = await chrome.storage.local.get({
          totalReplies: 0,
          totalResponseTime: 0,
          successCount: 0,
          failedCount: 0,
          lastUsedModel: '',
          fallbackCount: 0
        });
        
        await chrome.storage.local.set({
          totalReplies: (stats.totalReplies || 0) + 1,
          totalResponseTime: (stats.totalResponseTime || 0) + result.responseTime,
          successCount: (stats.successCount || 0) + 1,
          lastUsedModel: result.model,
          fallbackCount: (stats.fallbackCount || 0) + (result.isFallback ? 1 : 0)
        });
        
        // Add fallback info to response
        sendResponse({ 
          success: true, 
          reply: result.reply,
          usedFallback: result.isFallback || false,
          usedModel: result.model
        });
      } catch (error) {
        // Roll back daily count if it was incremented but request failed
        if (dailyCountIncremented) {
          // P1-14 修复:配额回滚加锁,避免并发失败导致计数误差
          await new Promise((resolve) => {
            _dailyLimitLock = _dailyLimitLock.then(async () => {
              try {
                const usageData = await chrome.storage.local.get(['dailyReplyCount']);
                const currentCount = usageData.dailyReplyCount || 1;
                await chrome.storage.local.set({ dailyReplyCount: Math.max(0, currentCount - 1) });
              } catch (rollbackErr) {
                console.warn('Failed to rollback daily count:', rollbackErr);
              }
              resolve();
            }).catch(() => { resolve(); }); // 防御性 catch,防止链断裂
          });
        }
        
        // Track failed requests
        const stats = await chrome.storage.local.get({ failedCount: 0 });
        await chrome.storage.local.set({ failedCount: (stats.failedCount || 0) + 1 });
        
        sendResponse({ success: false, error: error.message });
      }
    } else if (request.action === 'getHistory') {
      const data = await chrome.storage.local.get({ replyHistory: [] });
      sendResponse({ success: true, history: data.replyHistory });
    } else if (request.action === 'clearHistory') {
      await chrome.storage.local.set({ replyHistory: [] });
      sendResponse({ success: true });
    } else if (request.action === 'previewChat') {
      // Preview chat for options page - reuses tryGenerate with full provider support
      const data = await chrome.storage.sync.get(['personas', 'activePersonaId', 'tone', 'replyLength', 'faqData', 'fallbackModels', 'fallbackEnabled', 'licenseType']);
      await loadApiSettings(data);
      try {
        if (!data.apiKey) {
          throw new Error(chrome.i18n.getMessage('apiKeyNotConfigured') || 'Please configure the API Key first');
        }
        
        // Validate request.messages is an array (defensive against malformed messages)
        const messages = Array.isArray(request.messages) ? request.messages : [];
        
        const systemInstruction = buildSystemInstruction(data);
        
        const apiMessages = [
          { role: 'system', content: systemInstruction },
          ...messages
        ];
        
        // Build API URL
        const apiUrl = buildApiEndpoint(data.apiUrl || 'https://api.openai.com/v1/chat/completions');
        const modelName = data.modelName || 'gpt-3.5-turbo';
        const genResult = await tryGenerate(apiUrl, data.apiKey, modelName, apiMessages);
        
        sendResponse({ success: true, reply: genResult.reply });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    } else if (request.action === 'openOptions') {
      // Open options page to specific tab
      chrome.runtime.openOptionsPage();
      if (request.tab) {
        await chrome.storage.local.set({ pendingOptionsTab: request.tab });
      }
      sendResponse({ success: true });
    } else if (request.action === 'getDevices') {
      // 设备池：查询当前激活码绑定的设备列表
      try {
        const { licenseCode } = await chrome.storage.local.get(['licenseCode']);
        if (!licenseCode) {
          sendResponse({ success: false, error: chrome.i18n.getMessage('notActivated') || 'Not activated' });
          return;
        }
        let fingerprint = (await chrome.storage.local.get(['deviceFingerprint'])).deviceFingerprint;
        if (!fingerprint) {
          fingerprint = await generateFingerprintInBackground();
          if (fingerprint) await chrome.storage.local.set({ deviceFingerprint: fingerprint });
        }
        const timestamp = Date.now().toString();
        const response = await fetchWithRetry(`${API_BASE_URL}/api/license/devices`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: licenseCode.toUpperCase(),
            fingerprint,
            timestamp,
          })
        });
        if (!response.ok) {
          sendResponse({ success: false, error: `HTTP ${response.status}` });
          return;
        }
        const result = await response.json();
        if (!result.valid) {
          sendResponse({ success: false, error: result.error || (chrome.i18n.getMessage('queryFailed') || 'Query failed') });
          return;
        }
        sendResponse({
          success: true,
          devices: result.devices || [],
          maxDevices: result.maxDevices,
          remainingRebind: result.remainingRebind,
          rebindPaused: !!result.rebindPaused,
        });
      } catch (err) {
        console.warn('getDevices error:', err.message);
        sendResponse({ success: false, error: err.message });
      }
    } else if (request.action === 'unbindDevice') {
      // 设备池：用户主动踢设备（不消耗换绑次数）
      try {
        const { licenseCode } = await chrome.storage.local.get(['licenseCode']);
        if (!licenseCode) {
          sendResponse({ success: false, error: chrome.i18n.getMessage('notActivated') || 'Not activated' });
          return;
        }
        let fingerprint = (await chrome.storage.local.get(['deviceFingerprint'])).deviceFingerprint;
        if (!fingerprint) {
          fingerprint = await generateFingerprintInBackground();
        }
        const timestamp = Date.now().toString();
        const response = await fetchWithRetry(`${API_BASE_URL}/api/license/devices/unbind`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: licenseCode.toUpperCase(),
            fingerprint,
            timestamp,
            deviceId: request.deviceId,
          })
        }, 1);
        if (!response.ok) {
          sendResponse({ success: false, error: `HTTP ${response.status}` });
          return;
        }
        const result = await response.json();
        if (!result.valid) {
          sendResponse({ success: false, error: result.error || (chrome.i18n.getMessage('unbindFailed') || 'Unbind failed') });
          return;
        }
        sendResponse({ success: true, message: result.message });
      } catch (err) {
        console.warn('unbindDevice error:', err.message);
        sendResponse({ success: false, error: err.message });
      }
    } else {
      // Unknown action - always respond to prevent sender from hanging
      sendResponse({ success: false, error: `Unknown action: ${request.action}` });
    }
  };
  
  handleAsync().catch(err => {
    console.error('Message handler error:', err);
    sendResponse({ success: false, error: err.message });
  });
  
  return true; // Keep message channel open for async response
});

// Global error handler for Service Worker
self.addEventListener('error', (event) => {
  console.error('Service Worker Error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection:', event.reason);
});