// popup.js - 快捷控制面板

// SYNC: Daily usage limit for free tier - must match across all files (background.js, popup.js, options.js)
const DAILY_LIMIT = 50;

document.addEventListener('DOMContentLoaded', () => {
  // Dynamically display extension version from manifest
  const versionText = document.getElementById('versionText');
  if (versionText) {
    versionText.textContent = 'v' + chrome.runtime.getManifest().version;
  }
  
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const licenseBar = document.getElementById('licenseBar');
  const licenseStatus = document.getElementById('licenseStatus');
  const upgradeBtn = document.getElementById('upgradeBtn');
  const quickPanel = document.getElementById('quickPanel');
  const notConfigured = document.getElementById('notConfigured');
  
  const aiToggle = document.getElementById('aiToggle');
  const usageCount = document.getElementById('usageCount');
  const usageFill = document.getElementById('usageFill');
  const personaChips = document.getElementById('personaChips');
  const openOptionsBtn = document.getElementById('openOptionsBtn');
  const openSettingsBtn = document.getElementById('openSettingsBtn');
  const modelInfoBar = document.getElementById('modelInfoBar');
  const modelInfoName = document.getElementById('modelInfoName');
  const modelInfoEdit = document.getElementById('modelInfoEdit');

  // 默认角色列表
  const DEFAULT_PERSONAS = [
    { id: 'default', name: chrome.i18n.getMessage('defaultPersonaName') || '🧠 Professional Assistant (Default)' }
  ];

  // 加载设置并显示状态
  // 注意：apiUrl/apiKey/modelName 保存在 local storage（options.js doSave）
  chrome.storage.sync.get({
    connectionValid: null,
    personas: DEFAULT_PERSONAS,
    activePersonaId: 'default',
    licenseType: 'free',
    licenseCode: null,
    activatedAt: null
  }, (syncData) => {
    chrome.storage.local.get({
      aiButtonDisabled: false,
      apiUrl: '',
      apiKey: '',
      modelName: '',
      dailyReplyCount: 0,
      lastResetDate: null
    }, (localData) => {
      const data = {
        ...syncData,
        apiUrl: localData.apiUrl,
        apiKey: localData.apiKey,
        modelName: localData.modelName,
        dailyReplyCount: localData.dailyReplyCount,
        lastResetDate: localData.lastResetDate
      };
      updateUI(data, localData.aiButtonDisabled || false);
      updateLicenseStatus(data);
      updateUsageBar(data);
    });
  });

  function updateUI(settings, aiDisabled) {
    const isConfigured = settings.apiUrl && settings.apiKey && settings.modelName;

    if (!isConfigured) {
      statusDot.classList.remove('active');
      statusText.textContent = chrome.i18n.getMessage('pluginNotConfigured') || 'Extension not configured';
      quickPanel.style.display = 'none';
      notConfigured.style.display = 'block';
      if (modelInfoBar) modelInfoBar.style.display = 'none';
    } else {
      quickPanel.style.display = 'block';
      notConfigured.style.display = 'none';

      // 显示当前模型信息条
      if (modelInfoBar && modelInfoName) {
        modelInfoBar.style.display = 'flex';
        modelInfoName.textContent = settings.modelName || '—';
      }

      // AI toggle state
      if (aiToggle) {
        if (aiDisabled) {
          aiToggle.classList.remove('active');
          aiToggle.setAttribute('aria-checked', 'false');
        } else {
          aiToggle.classList.add('active');
          aiToggle.setAttribute('aria-checked', 'true');
        }
      }

      // 渲染 Persona chips
      renderPersonaChips(settings.personas, settings.activePersonaId);

      // 更新状态指示
      if (settings.connectionValid === true) {
        statusDot.classList.add('active');
        statusText.textContent = chrome.i18n.getMessage('connected') || 'Connected';
      } else if (settings.connectionValid === false) {
        statusDot.classList.remove('active');
        statusText.textContent = chrome.i18n.getMessage('apiConnFailed') || 'API connection failed';
      } else {
        statusDot.classList.remove('active');
        statusText.textContent = chrome.i18n.getMessage('apiNotTested') || 'API not tested';
      }
    }
  }

  // Usage progress bar
  function updateUsageBar(data) {
    const dailyCount = data.dailyReplyCount || 0;
    const today = new Date().toISOString().split('T')[0];
    const lastReset = data.lastResetDate;
    const effectiveCount = lastReset === today ? dailyCount : 0;
    const remaining = Math.max(0, DAILY_LIMIT - effectiveCount);
    const pct = Math.min(100, (effectiveCount / DAILY_LIMIT) * 100);

    if (usageCount) usageCount.textContent = `${effectiveCount}/${DAILY_LIMIT}`;
    if (usageFill) {
      usageFill.style.width = pct + '%';
      if (pct >= 90) usageFill.style.background = 'var(--error)';
      else if (pct >= 60) usageFill.style.background = 'var(--warning)';
      else usageFill.style.background = 'var(--success)';
    }
  }

  // 更新许可证状态显示
  function updateLicenseStatus(data) {
    const licenseType = data.licenseType || 'free';
    const dailyCount = data.dailyReplyCount || 0;
    const today = new Date().toISOString().split('T')[0];
    const lastReset = data.lastResetDate;
    const effectiveCount = lastReset === today ? dailyCount : 0;
    
    licenseBar.style.display = 'flex';
    
    if (licenseType === 'free') {
      const remaining = Math.max(0, DAILY_LIMIT - effectiveCount);
      if (remaining === 0) {
        licenseStatus.textContent = chrome.i18n.getMessage('quotaExhaustedToday') || "Today's quota exhausted";
        licenseStatus.style.color = 'var(--error)';
        upgradeBtn.textContent = chrome.i18n.getMessage('exhaustedUpgradePro') || 'Exhausted - Upgrade Pro';
        upgradeBtn.className = 'upgrade-btn upgrade-btn-error';
      } else if (remaining <= 5) {
        licenseStatus.textContent = chrome.i18n.getMessage('freeRemaining', [String(remaining)]) || `Free · ${remaining} remaining`;
        licenseStatus.style.color = 'var(--error)';
        upgradeBtn.textContent = chrome.i18n.getMessage('almostExhaustedUpgrade') || 'Almost exhausted - Upgrade';
        upgradeBtn.className = 'upgrade-btn upgrade-btn-warning';
      } else {
        licenseStatus.textContent = chrome.i18n.getMessage('freeRemaining', [String(remaining)]) || `Free · ${remaining} remaining`;
        licenseStatus.style.color = 'var(--success)';
        upgradeBtn.textContent = chrome.i18n.getMessage('upgradePro') || 'Upgrade Pro';
        upgradeBtn.className = 'upgrade-btn';
      }
      upgradeBtn.style.display = 'block';
    } else if (licenseType === 'lifetime') {
      licenseStatus.textContent = chrome.i18n.getMessage('proLifetime') || '✨ Pro Lifetime';
      licenseStatus.style.color = 'var(--success)';
      upgradeBtn.style.display = 'none';
    } else if (licenseType === 'year') {
      if (data.activatedAt) {
        const activatedAt = new Date(data.activatedAt);
        if (!isNaN(activatedAt.getTime())) {
          const expiresAt = new Date(activatedAt.getTime() + 365 * 24 * 60 * 60 * 1000);
          const daysLeft = Math.ceil((expiresAt - new Date()) / (24 * 60 * 60 * 1000));
          licenseStatus.textContent = chrome.i18n.getMessage('proDaysLeft', [String(Math.max(0, daysLeft))]) || `✨ Pro · ${Math.max(0, daysLeft)} days left`;
        } else {
          licenseStatus.textContent = chrome.i18n.getMessage('proYear') || '✨ Pro Yearly';
        }
      } else {
        licenseStatus.textContent = chrome.i18n.getMessage('proYear') || '✨ Pro Yearly';
      }
      licenseStatus.style.color = 'var(--success)';
      upgradeBtn.style.display = 'none';
    }
  }

  function renderPersonaChips(personas, activeId) {
    if (!personaChips) return;
    personaChips.innerHTML = '';
    
    if (!personas || personas.length === 0) {
      personas = DEFAULT_PERSONAS;
    }

    personas.forEach(persona => {
      const chip = document.createElement('button');
      chip.className = 'persona-chip' + (persona.id === activeId ? ' active' : '');
      chip.textContent = persona.name || persona.id;
      chip.addEventListener('click', () => {
        chrome.storage.sync.set({ activePersonaId: persona.id });
        // Update UI immediately
        personaChips.querySelectorAll('.persona-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
      });
      personaChips.appendChild(chip);
    });
  }

  // AI toggle handler
  if (aiToggle) {
    aiToggle.addEventListener('click', () => {
      const isActive = aiToggle.classList.contains('active');
      aiToggle.classList.toggle('active');
      const nowActive = !isActive;
      aiToggle.setAttribute('aria-checked', nowActive ? 'true' : 'false');
      chrome.storage.local.set({ aiButtonDisabled: !nowActive });
      // Notify content script to show/hide button
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleAIButton', disabled: !nowActive });
        }
      });
    });
  }

  // 打开高级控制台 (options.html)
  if (openOptionsBtn) {
    openOptionsBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
      window.close();
    });
  }

  // 打开设置页面 (options.html)
  if (openSettingsBtn) {
    openSettingsBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
      window.close();
    });
  }

  // 模型信息条 - 编辑按钮打开设置页
  if (modelInfoEdit) {
    modelInfoEdit.addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
      window.close();
    });
  }

  // 升级按钮 - 打开官网购买页面
  if (upgradeBtn) {
    upgradeBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://chat.sopie.cc/#pricing' });
      window.close();
    });
  }
});
