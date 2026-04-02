const PROVIDERS = {
  deepseek: {
    name: { zh: '深度求索 (DeepSeek)', en: 'DeepSeek' },
    icon: '<img src="' + chrome.runtime.getURL('icons/deepseek.svg') + '" style="width: 16px; height: 16px; margin-right: 8px; vertical-align: middle;">',
    url: 'https://api.deepseek.com/chat/completions',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    modelsInfo: {
      'deepseek-chat': { name: 'DeepSeek V3 (通用对话)', recommended: true },
      'deepseek-reasoner': { name: 'DeepSeek R1 (深度推理)', recommended: false }
    }
  },
  moonshot: {
    name: { zh: '月之暗面 (Kimi)', en: 'Moonshot (Kimi)' },
    icon: '<img src="' + chrome.runtime.getURL('icons/kimi.svg') + '" style="width: 16px; height: 16px; margin-right: 8px; vertical-align: middle;">',
    url: 'https://api.moonshot.cn/v1/chat/completions',
    models: ['kimi-k2.5', 'moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
    modelsInfo: {
      'kimi-k2.5': { name: 'Kimi K2.5 (万亿参数旗舰)', recommended: true },
      'moonshot-v1-8k': { name: 'Moonshot V1 8K', recommended: false },
      'moonshot-v1-32k': { name: 'Moonshot V1 32K', recommended: false },
      'moonshot-v1-128k': { name: 'Moonshot V1 128K (超长上下文)', recommended: false }
    }
  },
  qwen: {
    name: { zh: '通义千问 (Qwen)', en: 'Qwen (Alibaba)' },
    icon: '<img src="' + chrome.runtime.getURL('icons/qwen.svg') + '" style="width: 16px; height: 16px; margin-right: 8px; vertical-align: middle;">',
    url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    models: ['qwen-max', 'qwen-plus', 'qwen-turbo', 'qwen-long', 'qwen3-235b-a22b', 'qwen3-32b', 'qwen2.5-72b-instruct'],
    modelsInfo: {
      'qwen-max': { name: 'Qwen Max (最强旗舰)', recommended: true },
      'qwen-plus': { name: 'Qwen Plus (均衡性价比)', recommended: true },
      'qwen-turbo': { name: 'Qwen Turbo (快速响应)', recommended: false },
      'qwen-long': { name: 'Qwen Long (长文本)', recommended: false },
      'qwen3-235b-a22b': { name: 'Qwen3 235B (最新旗舰)', recommended: true },
      'qwen3-32b': { name: 'Qwen3 32B (轻量版)', recommended: false },
      'qwen2.5-72b-instruct': { name: 'Qwen2.5 72B', recommended: false }
    }
  },
  zhipu: {
    name: { zh: '智谱清言 (GLM)', en: 'Zhipu (GLM)' },
    icon: '<img src="' + chrome.runtime.getURL('icons/zhipu.svg') + '" style="width: 16px; height: 16px; margin-right: 8px; vertical-align: middle;">',
    url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    models: ['glm-4-plus', 'glm-4.5-flash', 'glm-4.7-flash', 'glm-z1-9b', 'glm-4-flash', 'glm-4-air', 'glm-4-long'],
    modelsInfo: {
      'glm-4-plus': { name: 'GLM-4 Plus (旗舰版)', recommended: true },
      'glm-4.5-flash': { name: 'GLM-4.5 Flash (快速免费)', recommended: true },
      'glm-4.7-flash': { name: 'GLM-4.7 Flash (最新免费)', recommended: true },
      'glm-z1-9b': { name: 'GLM-Z1 9B (推理增强)', recommended: false },
      'glm-4-flash': { name: 'GLM-4 Flash', recommended: false },
      'glm-4-air': { name: 'GLM-4 Air', recommended: false },
      'glm-4-long': { name: 'GLM-4 Long (长文本)', recommended: false }
    }
  },
  doubao: {
    name: { zh: '字节跳动 (豆包)', en: 'ByteDance (Doubao)' },
    icon: '<img src="' + chrome.runtime.getURL('icons/doubao.svg') + '" style="width: 16px; height: 16px; margin-right: 8px; vertical-align: middle;">',
    url: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    models: ['doubao-2.0-pro-32k', 'doubao-2.0-pro-128k', 'doubao-1.5-pro-32k', 'doubao-1.5-pro-128k', 'doubao-1.5-lite-32k', 'doubao-1.5-lite-128k', 'doubao-pro-32k', 'doubao-pro-128k', 'doubao-lite-32k', 'custom'],
    modelsInfo: {
      'doubao-2.0-pro-32k': { name: '豆包 2.0 Pro 32K (最新旗舰)', recommended: true },
      'doubao-2.0-pro-128k': { name: '豆包 2.0 Pro 128K', recommended: true },
      'doubao-1.5-pro-32k': { name: '豆包 1.5 Pro 32K', recommended: false },
      'doubao-1.5-pro-128k': { name: '豆包 1.5 Pro 128K', recommended: false },
      'doubao-1.5-lite-32k': { name: '豆包 1.5 Lite 32K (轻量)', recommended: false },
      'doubao-1.5-lite-128k': { name: '豆包 1.5 Lite 128K', recommended: false },
      'doubao-pro-32k': { name: '豆包 Pro 32K', recommended: false },
      'doubao-pro-128k': { name: '豆包 Pro 128K', recommended: false },
      'doubao-lite-32k': { name: '豆包 Lite 32K', recommended: false },
      'custom': { name: '自定义 Endpoint ID', recommended: false }
    }
  },
  openai: {
    name: { zh: 'OpenAI', en: 'OpenAI' },
    icon: '<img src="' + chrome.runtime.getURL('icons/openai.svg') + '" style="width: 16px; height: 16px; margin-right: 8px; vertical-align: middle;">',
    url: 'https://api.openai.com/v1/chat/completions',
    models: ['gpt-4.5-turbo', 'gpt-4o', 'gpt-4o-mini', 'o3', 'o3-mini', 'o1', 'o1-mini'],
    modelsInfo: {
      'gpt-4.5-turbo': { name: 'GPT-4.5 Turbo (最新旗舰)', recommended: true },
      'gpt-4o': { name: 'GPT-4o (多模态旗舰)', recommended: true },
      'gpt-4o-mini': { name: 'GPT-4o Mini (轻量快速)', recommended: true },
      'o3': { name: 'O3 (推理增强旗舰)', recommended: true },
      'o3-mini': { name: 'O3 Mini (推理轻量)', recommended: false },
      'o1': { name: 'O1 (深度推理)', recommended: false },
      'o1-mini': { name: 'O1 Mini', recommended: false }
    }
  },
  google: {
    name: { zh: 'Google Gemini', en: 'Google Gemini' },
    icon: '<img src="' + chrome.runtime.getURL('icons/google.svg') + '" style="width: 16px; height: 16px; margin-right: 8px; vertical-align: middle;">',
    url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    models: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    modelsInfo: {
      'gemini-2.5-pro': { name: 'Gemini 2.5 Pro (最新旗舰)', recommended: true },
      'gemini-2.5-flash': { name: 'Gemini 2.5 Flash (快速)', recommended: true },
      'gemini-2.0-flash': { name: 'Gemini 2.0 Flash', recommended: false },
      'gemini-2.0-flash-lite': { name: 'Gemini 2.0 Flash Lite', recommended: false },
      'gemini-1.5-pro': { name: 'Gemini 1.5 Pro', recommended: false },
      'gemini-1.5-flash': { name: 'Gemini 1.5 Flash', recommended: false }
    }
  },
  custom: {
    name: { zh: '自定义服务商', en: 'Custom Provider' },
    icon: '<img src="' + chrome.runtime.getURL('icons/custom.svg') + '" style="width: 16px; height: 16px; margin-right: 8px; vertical-align: middle;">',
    url: '',
    models: ['custom'],
    modelsInfo: {
      'custom': { name: '自定义模型名称', recommended: false }
    }
  }
};

const I18N = {
  en: {
    title: 'ChatGenius AI',
    provider: 'AI Provider',
    model: 'Model',
    apiUrl: 'API URL',
    apiKey: 'API Key',
    save: 'Save Settings',
    saved: 'Saved successfully!',
    statusInactive: 'Disconnected',
    statusActive: 'Connected',
    statusNoKey: 'Missing API Key',
    statusNoModel: 'No Model Selected',
    testConnection: 'Test Connection',
    moreSettings: 'More Settings',
    helpGuide: 'Help & Guide',
    instructionsTitle: 'User Guide',
    close: 'Got it',
    instructionsContent: '1. Configure API: Set your AI Provider and API Key above.<br><br>2. Set Persona: Click More Settings to define your custom persona.<br><br>3. Use in Chat: Open WhatsApp or Messenger web. A floating "AI Reply" button will appear.'
  },
  zh: {
    title: 'ChatGenius AI',
    provider: 'AI 服务商',
    model: '模型',
    apiUrl: 'API 地址',
    apiKey: '密钥',
    save: '保存设置',
    saved: '保存成功！',
    statusInactive: '未连接',
    statusActive: '运行正常',
    statusNoKey: '缺少 API 密钥',
    statusNoModel: '未选择模型',
    testConnection: '测试连接',
    moreSettings: '更多设置',
    helpGuide: '使用教程',
    instructionsTitle: '使用说明',
    close: '知道了',
    instructionsContent: '1. 配置 API：在上方设置您的 AI 服务商和 API 密钥。<br><br>2. 设置人设：点击更多设置来定义您的专属角色。<br><br>3. 在聊天中使用：打开 WhatsApp 或 Messenger 网页版。聊天窗口旁会出现悬浮按钮。'
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const providerSelect = document.getElementById('provider');
  const providerIcon = document.getElementById('providerIcon');
  const customProviderNameInput = document.getElementById('customProviderName');
  const modelSelect = document.getElementById('modelName');
  const customModelInput = document.getElementById('customModel');
  const apiUrlInput = document.getElementById('apiUrl');
  const apiKeyInput = document.getElementById('apiKey');
  const saveBtn = document.getElementById('saveBtn');
  const testBtn = document.getElementById('testBtn');
  const settingsToggle = document.getElementById('settingsToggle');
  const langToggle = document.getElementById('langToggle');
  const openSettingsBtn = document.getElementById('openSettingsBtn');
  const helpBtn = document.getElementById('helpBtn');
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  const toggleApiKey = document.getElementById('toggleApiKey');
  const eyeIcon = document.getElementById('eyeIcon');
  const eyeOffIcon = document.getElementById('eyeOffIcon');

  // Toggle API Key visibility
  if (toggleApiKey) {
    toggleApiKey.addEventListener('click', () => {
      const isPassword = apiKeyInput.type === 'password';
      apiKeyInput.type = isPassword ? 'text' : 'password';
      eyeIcon.style.display = isPassword ? 'none' : 'block';
      eyeOffIcon.style.display = isPassword ? 'block' : 'none';
    });
  }

  if (helpBtn) {
    helpBtn.addEventListener('click', () => {
      const modal = document.getElementById('helpModal');
      if (modal) modal.style.display = 'flex';
    });
  }
  
  const closeHelpBtn = document.getElementById('closeHelpBtn');
  if (closeHelpBtn) {
    closeHelpBtn.addEventListener('click', () => {
      const modal = document.getElementById('helpModal');
      if (modal) modal.style.display = 'none';
    });
  }
  
  let currentLang = 'zh';

  function applyI18n() {
    document.documentElement.lang = currentLang === 'zh' ? 'zh-CN' : 'en';
    if (langToggle) {
      langToggle.textContent = currentLang === 'zh' ? 'EN' : '中';
    }
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (I18N[currentLang][key]) {
        el.innerHTML = I18N[currentLang][key];
      }
    });

    // Update provider names in select
    const currentVal = providerSelect.value;
    providerSelect.innerHTML = '';
    Object.entries(PROVIDERS).forEach(([key, data]) => {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = data.name[currentLang] || data.name.en;
      providerSelect.appendChild(option);
    });
    providerSelect.value = currentVal;
    updateProviderIcon(currentVal);
  }

  function updateProviderIcon(key) {
    if (PROVIDERS[key]) {
      providerIcon.innerHTML = PROVIDERS[key].icon;
    }
  }

  function showToast(msg, type = 'success') {
    toastMsg.textContent = msg;
    toast.className = type === 'error' ? 'error show' : 'success show';
    
    // Update icon based on type
    const icon = document.getElementById('toastIcon');
    if (type === 'error') {
      icon.innerHTML = '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>';
      icon.setAttribute('stroke', '#ef4444');
    } else {
      icon.innerHTML = '<polyline points="20 6 9 17 4 12"></polyline>';
      icon.setAttribute('stroke', '#10b981');
    }

    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  function openSettings() {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options.html'));
    }
  }

  settingsToggle.addEventListener('click', openSettings);
  openSettingsBtn.addEventListener('click', openSettings);

  if (langToggle) {
    langToggle.addEventListener('click', () => {
      currentLang = currentLang === 'zh' ? 'en' : 'zh';
      chrome.storage.sync.get(null, (data) => {
        const newData = { ...data, lang: currentLang };
        chrome.storage.sync.set({ lang: currentLang }, () => {
          applyI18n();
          updateStatus(newData);
        });
      });
    });
  }

  // Populate providers
  Object.entries(PROVIDERS).forEach(([key, data]) => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = data.name[currentLang] || data.name.en;
    providerSelect.appendChild(option);
  });

  function updateModels(providerKey, selectedModel) {
    modelSelect.innerHTML = '';
    const models = PROVIDERS[providerKey].models;
    const modelsInfo = PROVIDERS[providerKey].modelsInfo || {};

    // Separate recommended and other models
    const recommendedModels = [];
    const otherModels = [];

    models.forEach(model => {
      const info = modelsInfo[model] || {};
      if (info.recommended) {
        recommendedModels.push(model);
      } else {
        otherModels.push(model);
      }
    });

    // Add recommended models group
    if (recommendedModels.length > 0) {
      const recommendedGroup = document.createElement('optgroup');
      recommendedGroup.label = currentLang === 'zh' ? '⭐ 推荐模型' : '⭐ Recommended';

      recommendedModels.forEach(model => {
        const option = document.createElement('option');
        option.value = model;
        const info = modelsInfo[model] || {};
        option.textContent = info.name || model;
        recommendedGroup.appendChild(option);
      });

      modelSelect.appendChild(recommendedGroup);
    }

    // Add other models group
    if (otherModels.length > 0) {
      const otherGroup = document.createElement('optgroup');
      otherGroup.label = currentLang === 'zh' ? '其他模型' : 'Other Models';

      otherModels.forEach(model => {
        const option = document.createElement('option');
        option.value = model;
        const info = modelsInfo[model] || {};
        option.textContent = info.name || model;
        otherGroup.appendChild(option);
      });

      modelSelect.appendChild(otherGroup);
    }

    updateProviderIcon(providerKey);

    const isCustomProvider = providerKey === 'custom';

    if (isCustomProvider) {
      modelSelect.style.display = 'none';
      customModelInput.style.display = 'block';
      customProviderNameInput.style.display = 'block';
      if (selectedModel) customModelInput.value = selectedModel;
      customModelInput.placeholder = 'e.g. gpt-4';
    } else {
      modelSelect.style.display = 'block';
      customProviderNameInput.style.display = 'none';
      if (selectedModel && models.includes(selectedModel)) {
        modelSelect.value = selectedModel;
      } else if (selectedModel && !models.includes(selectedModel) && models.includes('custom')) {
        modelSelect.value = 'custom';
        customModelInput.value = selectedModel;
      } else {
        // Select first recommended model by default
        modelSelect.value = recommendedModels.length > 0 ? recommendedModels[0] : models[0];
      }

      if (modelSelect.value === 'custom') {
        customModelInput.style.display = 'block';
        customModelInput.placeholder = providerKey === 'doubao' ? 'Endpoint ID (e.g. ep-2024...)' : 'e.g. gpt-4';
      } else {
        customModelInput.style.display = 'none';
      }
    }
  }

  providerSelect.addEventListener('change', (e) => {
    const provider = e.target.value;
    updateModels(provider);
    if (provider !== 'custom') {
      apiUrlInput.value = PROVIDERS[provider].url;
    }
    updateFreeApiLink(provider);
  });

  // Free API Key links
  const FREE_API_LINKS = {
    deepseek: { url: 'https://platform.deepseek.com/signup', text: '🎁 免费获取 API Key (DeepSeek 送500万tokens)' },
    moonshot: { url: 'https://platform.moonshot.cn/', text: '🎁 免费获取 Kimi API Key' },
    qwen: { url: 'https://dashscope.console.aliyun.com/', text: '🎁 免费获取通义千问 API Key' },
    zhipu: { url: 'https://open.bigmodel.cn/', text: '🎁 免费获取智谱 API Key (新用户送tokens)' },
    doubao: { url: 'https://console.volcengine.com/ark', text: '🎁 免费获取豆包 API Key' },
    openai: { url: 'https://platform.openai.com/signup', text: '🔗 获取 OpenAI API Key' },
    google: { url: 'https://aistudio.google.com/apikey', text: '🎁 免费获取 Google API Key' },
    custom: { url: null, text: null }
  };

  function updateFreeApiLink(provider) {
    const link = document.getElementById('freeApiLink');
    if (!link) return;

    const info = FREE_API_LINKS[provider];
    if (info && info.url) {
      link.href = info.url;
      link.textContent = info.text;
      link.style.display = 'block';
    } else {
      link.style.display = 'none';
    }
  }

  modelSelect.addEventListener('change', (e) => {
    const provider = providerSelect.value;
    if (e.target.value === 'custom') {
      customModelInput.style.display = 'block';
      customModelInput.placeholder = provider === 'doubao' ? 'Endpoint ID (e.g. ep-2024...)' : 'e.g. gpt-4';
    } else {
      customModelInput.style.display = 'none';
    }
  });

  function updateStatus(settings) {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const lang = settings.lang || currentLang || 'en';
    const t = I18N[lang];

    if (!settings.apiKey) {
      statusDot.classList.remove('active');
      statusText.textContent = t.statusNoKey;
    } else if (!settings.modelName) {
      statusDot.classList.remove('active');
      statusText.textContent = t.statusNoModel;
    } else if (settings.connectionValid === true) {
      statusDot.classList.add('active');
      statusText.textContent = t.statusActive;
    } else {
      statusDot.classList.remove('active');
      statusText.textContent = t.statusInactive;
    }
  }

  // Load saved settings
  chrome.storage.sync.get({
    provider: 'deepseek',
    apiUrl: 'https://api.deepseek.com/chat/completions',
    modelName: 'deepseek-chat',
    customProviderName: '',
    apiKey: '',
    theme: 'light',
    lang: 'zh',
    connectionValid: null
  }, (data) => {
    updateStatus(data);
    currentLang = data.lang;
    document.documentElement.setAttribute('data-theme', data.theme);
    applyI18n();

    providerSelect.value = data.provider;
    updateModels(data.provider, data.modelName);
    updateFreeApiLink(data.provider);
    if (data.provider === 'custom') {
      customProviderNameInput.value = data.customProviderName || '';
    }
    apiUrlInput.value = data.apiUrl;
    apiKeyInput.value = data.apiKey;
  });

  // Save settings
  saveBtn.addEventListener('click', () => {
    const provider = providerSelect.value;
    const isCustomModel = provider === 'custom' || (PROVIDERS[provider].models.length === 1 && PROVIDERS[provider].models[0] === 'custom');
    const modelName = isCustomModel ? customModelInput.value : modelSelect.value;
    const customProviderName = provider === 'custom' ? customProviderNameInput.value : '';
    const apiUrl = apiUrlInput.value;
    const apiKey = apiKeyInput.value;

    saveBtn.disabled = true;
    saveBtn.style.opacity = '0.7';

    chrome.storage.sync.get(['apiKey', 'apiUrl', 'modelName', 'connectionValid'], async (data) => {
      let isConnectionValid = data.connectionValid;
      let needsTest = false;
      
      if (data.apiKey !== apiKey || data.apiUrl !== apiUrl || data.modelName !== modelName) {
        isConnectionValid = false;
        needsTest = true;
      }

      const settings = {
        provider,
        modelName,
        customProviderName,
        apiUrl,
        apiKey,
        connectionValid: isConnectionValid
      };

      chrome.storage.sync.set(settings, async () => {
        updateStatus(settings);
        
        if (needsTest && apiKey) {
          showToast(currentLang === 'zh' ? '正在自动测试连接...' : 'Testing connection...', 'success');
          // Trigger the test button click logic manually or call a shared function
          // For simplicity, we'll just click the test button if it exists
          if (testBtn) {
            testBtn.click();
          }
        } else {
           showToast(I18N[currentLang].saved, 'success');
        }
        
        saveBtn.disabled = false;
        saveBtn.style.opacity = '1';
      });
    });
  });

  // Test Connection
  if (testBtn) {
    testBtn.addEventListener('click', async () => {
      const provider = providerSelect.value;
      const isCustomModel = provider === 'custom' || (PROVIDERS[provider].models.length === 1 && PROVIDERS[provider].models[0] === 'custom');
      const modelName = isCustomModel ? customModelInput.value : modelSelect.value;
      const apiUrl = apiUrlInput.value;
      const apiKey = apiKeyInput.value;

      if (!apiKey) {
        showToast(currentLang === 'zh' ? '请输入 API Key' : 'Please enter API Key', 'error');
        return;
      }

      testBtn.classList.add('testing');
      testBtn.disabled = true;
      const originalText = testBtn.innerHTML;
      testBtn.innerHTML = '<svg class="wa-ai-spin" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg> ' + (currentLang === 'zh' ? '测试中...' : 'Testing...');

      try {
        let endpoint = apiUrl.replace(/\/+$/, '');
        if (!endpoint.endsWith('/chat/completions') && !endpoint.endsWith('/messages')) {
          endpoint += '/chat/completions';
        }

        const bodyData = {
          model: modelName,
          messages: [{ role: 'user', content: 'Hello' }]
        };

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey.trim()}`
          },
          body: JSON.stringify(bodyData)
        });

        const resData = await response.json().catch(() => null);

        if (response.ok && (!resData || !resData.error)) {
          showToast(currentLang === 'zh' ? '连接成功！' : 'Connection Successful!', 'success');
          // Auto save on success
          chrome.storage.sync.set({ provider, modelName, apiUrl, apiKey, connectionValid: true }, () => {
            updateStatus({ provider, modelName, apiUrl, apiKey, connectionValid: true });
          });
        } else {
          console.error('API Test Error:', resData || response.status);
          let errMsg = `HTTP ${response.status}`;
          if (resData && resData.error) {
            errMsg = resData.error.message || resData.error.code || errMsg;
          }
          showToast(currentLang === 'zh' ? `连接失败: ${errMsg}。请检查 API Key 或模型选项。` : `Connection Failed: ${errMsg}. Please check API Key or model options.`, 'error');
          chrome.storage.sync.set({ connectionValid: false }, () => {
            updateStatus({ provider, modelName, apiUrl, apiKey, connectionValid: false });
          });
        }
      } catch (error) {
        console.error('Network Error:', error);
        showToast(currentLang === 'zh' ? '网络错误，请检查 API URL、API Key 或模型选项。' : 'Network Error, check API URL, API Key or model options.', 'error');
        chrome.storage.sync.set({ connectionValid: false }, () => {
          updateStatus({ provider, modelName, apiUrl, apiKey, connectionValid: false });
        });
      } finally {
        testBtn.classList.remove('testing');
        testBtn.disabled = false;
        testBtn.innerHTML = originalText;
      }
    });
  }
});