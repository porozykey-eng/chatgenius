// Reply history management
const MAX_HISTORY = 50;
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // 1 second base delay

// SYNC: Daily usage limit for free tier - must match across all files (background.js, popup.js, options.js)
const DAILY_LIMIT = 20;

// SYNC: Backend API base URL - must match across all files (background.js, options.js)
const API_BASE_URL = 'https://chat.sopie.cc';

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
    const { licenseCode, licenseType } = await chrome.storage.sync.get(['licenseCode', 'licenseType']);
    
    if (licenseCode) {
      // Cloud verification - call backend API
      try {
        const apiUrl = API_BASE_URL; // SYNC: must match options.js
        // Sanitize licenseCode to prevent URL injection
        const safeCode = encodeURIComponent(String(licenseCode).slice(0, 64));
        const response = await fetch(`${apiUrl}/api/license/status/${safeCode}`);
        
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
            licenseCode: null,
            licenseInvalid: true
          });
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
}

// Default fallback models configuration
const DEFAULT_FALLBACK_MODELS = [
  { name: 'gpt-3.5-turbo', apiUrl: 'https://api.openai.com/v1', enabled: true },
  { name: 'claude-3-haiku-20240307', apiUrl: 'https://api.anthropic.com/v1', enabled: false },
  { name: 'gemini-pro', apiUrl: 'https://generativelanguage.googleapis.com/v1', enabled: false }
];

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
        lastError = new Error(`请求超时 (${FETCH_TIMEOUT / 1000}秒)，请检查网络连接`);
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
      
      const data = await chrome.storage.sync.get(['provider', 'apiUrl', 'apiKey', 'modelName', 'personas', 'activePersonaId', 'tone', 'replyLength', 'faqData', 'totalReplies', 'fallbackModels', 'fallbackEnabled', 'licenseType', 'licenseCode']);
      try {
        if (!data.apiKey) {
          throw new Error('API Key not configured. Please open settings.');
        }

        // Server-side license verification for Pro users (prevents client-side tampering)
        const localLicenseType = data.licenseType || 'free';
        let licenseType = localLicenseType;
        if (localLicenseType !== 'free' && data.licenseCode) {
          try {
            const verifyResponse = await fetch(`${API_BASE_URL}/api/license/verify-token`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ licenseCode: data.licenseCode })
            });
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
                  throw new Error(`免费版每日限制 ${dailyLimit} 次回复已用完。升级到 Pro 版无限制。`);
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
            });
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
          try {
            const usageData = await chrome.storage.local.get(['dailyReplyCount']);
            const currentCount = usageData.dailyReplyCount || 1;
            await chrome.storage.local.set({ dailyReplyCount: Math.max(0, currentCount - 1) });
          } catch (rollbackErr) {
            console.warn('Failed to rollback daily count:', rollbackErr);
          }
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
      const data = await chrome.storage.sync.get(['provider', 'apiUrl', 'apiKey', 'modelName', 'personas', 'activePersonaId', 'tone', 'replyLength', 'faqData', 'fallbackModels', 'fallbackEnabled', 'licenseType']);
      try {
        if (!data.apiKey) {
          throw new Error('请先配置 API Key');
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