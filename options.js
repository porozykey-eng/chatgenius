const I18N = {
  en: {
    title: 'AI Auto-Reply Settings',
    instructionsTitle: 'User Guide',
    close: 'Got it',
    instructionsContent: '1. Configure API: Click the extension icon in the toolbar to set your AI Provider and API Key.<br><br>2. Set Persona: Define your custom persona below (e.g., Sales Manager, Tech Support) so the AI knows how to act.<br><br>3. Use in Chat: Open WhatsApp or Messenger web. A floating "AI Reply" button will appear. Click it (or use the shortcut) to generate a context-aware reply based on the recent chat history.',
    proTitle: 'Elite Pro Intelligence',
    proPrice: '$9.90 / Year',
    proUpgradeBtn: 'Upgrade to Elite Pro',
    proFeatures: [
      { title: 'Unlimited Personas', desc: 'Create as many AI identities as you need.', icon: '🎭' },
      { title: 'Knowledge Base', desc: 'Upload PDFs or sync FAQs for smarter replies.', icon: '📚' },
      { title: 'Priority Models', desc: 'Access to GPT-4o and Gemini 1.5 Pro.', icon: '⚡' },
      { title: 'Cloud Sync', desc: 'Sync settings across all your devices.', icon: '☁️' }
    ],
    personaSettings: 'Custom Personas',
    personaHelp: 'Create custom personas. Select one to use as the active persona.',
    addPersona: '+ Add Persona',
    personaName: 'Persona Name',
    personaPrompt: 'System Prompt',
    replySettings: 'Reply Preferences',
    tone: 'Reply Tone',
    toneAuto: 'Auto (Context-based)',
    tonePro: 'Professional',
    toneFriendly: 'Friendly & Warm',
    toneEmpathetic: 'Empathetic',
    toneDirect: 'Direct & Concise',
    replyLength: 'Reply Length',
    lenAuto: 'Auto',
    lenShort: 'Short (1-2 sentences)',
    lenMedium: 'Medium (2-4 sentences)',
    lenLong: 'Detailed',
    faq: 'Knowledge Base / FAQ',
    addFaq: '+ Add Q&A',
    faqHelp: 'AI will naturally weave this info into replies.',
    uiSettings: 'UI & Interaction',
    shortcut: 'Shortcut Key',
    shortcutHelp: 'Click and press keys. Press Backspace to clear.',
    btnTheme: 'Floating Button Theme',
    themeGradient: 'Gradient Glow',
    themeGlass: 'Glassmorphism',
    themeNeon: 'Cyber Neon',
    themeMinimal: 'Minimalist',
    theme3D: '3D Pop',
    themeCyberpunk: 'Cyberpunk',
    themeMaterial: 'Material Design',
    themeHolographic: 'Holographic',
    btnOpacity: 'Button Opacity',
    save: 'Save Settings',
    saved: 'Saved Successfully!',
    error: 'Error saving settings',
    livePreview: 'Live Persona Preview',
    previewHelp: 'Test your active persona in real-time.',
    statReplies: 'Total Replies',
    statTimeSaved: 'Time Saved',
    statStatus: 'System Status',
    templateLibrary: 'Template Library',
    templateHelp: 'Choose a preset template to quickly create a new persona.',
    useTemplate: 'Use Template',
    templateSales: 'Sales Manager',
    templateSalesDesc: 'Professional sales representative for product promotion',
    templateSupport: 'Customer Support',
    templateSupportDesc: 'Friendly support agent for customer inquiries',
    templateTech: 'Technical Support',
    templateTechDesc: 'Expert technical advisor for product issues',
    templateProduct: 'Product Consultant',
    templateProductDesc: 'Knowledgeable consultant for product recommendations',
    templateSuccess: 'Customer Success',
    templateSuccessDesc: 'Dedicated manager for customer onboarding'
  },
  zh: {
    title: 'AI 自动回复设置',
    instructionsTitle: '使用说明',
    close: '知道了',
    instructionsContent: '1. 配置 API：点击浏览器工具栏中的插件图标，设置您的 AI 提供商和 API Key。<br><br>2. 设置人设：在下方创建并选择您的专属角色（例如：销售经理、技术支持），让 AI 知道如何回复客户。<br><br>3. 在聊天中使用：打开 WhatsApp 或 Messenger 网页版。聊天窗口旁会出现一个“AI Reply”悬浮按钮。点击它（或使用快捷键）即可根据最近的聊天记录生成回复。',
    proTitle: 'Elite Pro 智能版',
    proPrice: '$9.90 / 年',
    proUpgradeBtn: '立即升级至 Elite Pro',
    proFeatures: [
      { title: '无限角色模板', desc: '随心所欲创建多种 AI 身份。', icon: '🎭' },
      { title: '超大知识库', desc: '支持上传文档或同步 FAQ。', icon: '📚' },
      { title: '顶级模型', desc: '优先访问 GPT-4o 和 Gemini 1.5 Pro。', icon: '⚡' },
      { title: '云端同步', desc: '多设备同步您的所有设置。', icon: '☁️' }
    ],
    personaSettings: '自定义角色',
    personaHelp: '创建自定义角色。选择一个作为当前激活的角色。',
    addPersona: '+ 添加角色',
    personaName: '角色名称',
    personaPrompt: '系统提示词 (Prompt)',
    replySettings: '回复偏好',
    tone: '回复语气',
    toneAuto: '自动 (根据语境)',
    tonePro: '专业严谨',
    toneFriendly: '热情友好',
    toneEmpathetic: '共情理解',
    toneDirect: '直接干练',
    replyLength: '回复长度',
    lenAuto: '自动',
    lenShort: '简短 (1-2句话)',
    lenMedium: '适中 (2-4句话)',
    lenLong: '详细',
    faq: '常用问答 / 知识库 (FAQ)',
    addFaq: '+ 添加问答',
    faqHelp: '输入常见问题和答案，AI 会根据客户问题自然地融入这些信息，而不是生硬复制。',
    uiSettings: '界面与交互',
    shortcut: '快捷键',
    shortcutHelp: '点击后按下组合键。按 Backspace 清除。',
    btnTheme: '悬浮按钮主题',
    themeGradient: '渐变发光',
    themeGlass: '毛玻璃',
    themeNeon: '赛博霓虹',
    themeMinimal: '极简主义',
    theme3D: '3D 立体',
    themeCyberpunk: '赛博朋克',
    themeMaterial: '质感设计',
    themeHolographic: '全息幻彩',
    btnOpacity: '悬浮按钮透明度',
    save: '保存设置',
    saved: '保存成功！',
    error: '保存失败',
    livePreview: '实时人设预览',
    previewHelp: '实时测试您当前选择的角色回复效果。',
    statReplies: '累计回复',
    statTimeSaved: '节省时间',
    statStatus: '系统状态',
    templateLibrary: '模板库',
    templateHelp: '选择预设模板快速创建新角色。',
    useTemplate: '使用模板',
    templateSales: '销售经理',
    templateSalesDesc: '专业的产品推广销售代表',
    templateSupport: '客服代表',
    templateSupportDesc: '友好的客户咨询支持专员',
    templateTech: '技术支持',
    templateTechDesc: '专业的技术问题解答顾问',
    templateProduct: '产品顾问',
    templateProductDesc: '知识丰富的产品推荐专家',
    templateSuccess: '客户成功经理',
    templateSuccessDesc: '专注于客户引导和服务的经理',
    onboardingSkip: '跳过',
    onboardingNext: '下一步',
    onboardingFinish: '完成',
    onboardingStep1Title: '欢迎使用 ChatGenius AI',
    onboardingStep1Desc: '这是一个智能回复助手，可以帮助您在聊天中快速生成专业回复。让我们一起了解主要功能吧！',
    onboardingStep2Title: '创建 AI 角色',
    onboardingStep2Desc: '在「AI 角色」标签页中，您可以定义不同的AI人设。例如：销售经理、客服代表等。点击「模板库」可快速使用预设模板。',
    onboardingStep3Title: '添加知识库',
    onboardingStep3Desc: '在「知识库」标签页中，添加常见问答。AI会根据客户问题自然地融入这些信息，让回复更加专业准确。',
    onboardingStep4Title: '设置回复偏好',
    onboardingStep4Desc: '在「偏好设置」中，您可以调整回复语气、长度、快捷键和悬浮按钮样式，定制您的专属体验。',
    onboardingStep5Title: '开始使用',
    onboardingStep5Desc: '点击扩展图标配置API，然后在 WhatsApp/Messenger 网页版中点击悬浮按钮即可生成智能回复。祝您使用愉快！'
  }
};

// Onboarding Tour Steps
const ONBOARDING_STEPS = [
  {
    target: '.page-header',
    titleKey: 'onboardingStep1Title',
    descKey: 'onboardingStep1Desc'
  },
  {
    target: '#tab-personas',
    titleKey: 'onboardingStep2Title',
    descKey: 'onboardingStep2Desc'
  },
  {
    target: '#tab-knowledge',
    titleKey: 'onboardingStep3Title',
    descKey: 'onboardingStep3Desc'
  },
  {
    target: '#tab-settings',
    titleKey: 'onboardingStep4Title',
    descKey: 'onboardingStep4Desc'
  },
  {
    target: '.save-section',
    titleKey: 'onboardingStep5Title',
    descKey: 'onboardingStep5Desc'
  }
];

// Persona Templates
const PERSONA_TEMPLATES = [
  {
    id: 'sales',
    icon: '💼',
    nameKey: 'templateSales',
    descKey: 'templateSalesDesc',
    prompt: '你是[公司名称]的销售经理。你的目标是了解客户需求，推荐合适的产品，并促成交易。\n\n回复时请：\n1. 礼貌热情，展现专业形象\n2. 主动询问客户的具体需求（如产品类型、数量、预算等）\n3. 根据需求推荐最适合的产品\n4. 在适当时机引导客户下单或索取联系方式\n\n语气：专业但友好，让客户感受到诚意。'
  },
  {
    id: 'support',
    icon: '🎧',
    nameKey: 'templateSupport',
    descKey: 'templateSupportDesc',
    prompt: '你是[公司名称]的客服代表。你的职责是解答客户疑问，处理投诉，提供满意的服务体验。\n\n回复时请：\n1. 保持耐心和同理心\n2. 清晰解答客户的问题\n3. 主动提供解决方案\n4. 必要时引导客户联系人工客服\n\n语气：温暖友好，让客户感到被重视。'
  },
  {
    id: 'tech',
    icon: '🔧',
    nameKey: 'templateTech',
    descKey: 'templateTechDesc',
    prompt: '你是[公司名称]的技术支持专家。你负责解决客户在使用产品过程中遇到的技术问题。\n\n回复时请：\n1. 准确理解客户描述的问题\n2. 提供清晰的解决步骤\n3. 必要时询问更多细节（如错误信息、设备型号等）\n4. 复杂问题建议提交工单\n\n语气：专业严谨，但通俗易懂。'
  },
  {
    id: 'product',
    icon: '🎯',
    nameKey: 'templateProduct',
    descKey: 'templateProductDesc',
    prompt: '你是[公司名称]的产品顾问。你对所有产品特性了如指掌，能为客户提供专业的产品建议。\n\n回复时请：\n1. 了解客户的使用场景和需求\n2. 对比不同产品的优劣\n3. 推荐最匹配的产品方案\n4. 解释推荐理由\n\n语气：专业且具有说服力。'
  },
  {
    id: 'success',
    icon: '⭐',
    nameKey: 'templateSuccess',
    descKey: 'templateSuccessDesc',
    prompt: '你是[公司名称]的客户成功经理。你的目标是帮助客户成功使用产品，提升满意度和留存率。\n\n回复时请：\n1. 了解客户当前的使用情况\n2. 主动提供使用建议和最佳实践\n3. 关注客户可能遇到的困难\n4. 引导客户充分利用产品功能\n\n语气：亲切关怀，展现长期服务的诚意。'
  }
];

document.addEventListener('DOMContentLoaded', () => {
  // Tab Navigation
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      // Update button states
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update content visibility
      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === `tab-${targetTab}`) {
          content.classList.add('active');
        }
      });
    });
  });

  const personaList = document.getElementById('personaList');
  const addPersonaBtn = document.getElementById('addPersonaBtn');
  const shortcutInput = document.getElementById('shortcut');
  const toneSelect = document.getElementById('tone');
  const replyLengthSelect = document.getElementById('replyLength');
  const faqList = document.getElementById('faqList');
  const addFaqBtn = document.getElementById('addFaqBtn');
  const importFaqBtn = document.getElementById('importFaqBtn');
  const exportFaqBtn = document.getElementById('exportFaqBtn');
  const faqFileInput = document.getElementById('faqFileInput');
  const faqSearchInput = document.getElementById('faqSearch');
  const faqCategoryFilter = document.getElementById('faqCategoryFilter');
  
  // Persona search and recent tags
  const personaSearchInput = document.getElementById('personaSearch');
  const recentTagsContainer = document.getElementById('recentTagsContainer');
  const recentTags = document.getElementById('recentTags');

  // FAQ categories
  const FAQ_CATEGORIES = {
    product: { label: '产品相关', color: '#667eea' },
    price: { label: '价格咨询', color: '#34c759' },
    service: { label: '售后服务', color: '#ff9500' },
    other: { label: '其他', color: '#86868b' }
  };

  let faqSearchQuery = '';
  let faqCategoryQuery = 'all';
  let personaSearchQuery = '';
  let recentPersonas = []; // Track recently used personas
  let selectedFaqIndices = new Set(); // Track selected FAQ items for batch operations
  
  // Batch operation elements
  const faqBatchToolbar = document.getElementById('faqBatchToolbar');
  const faqSelectAll = document.getElementById('faqSelectAll');
  const batchCount = document.getElementById('batchCount');
  const batchDeleteBtn = document.getElementById('batchDeleteBtn');
  const batchCategorySelect = document.getElementById('batchCategorySelect');
  const smartCategorizeBtn = document.getElementById('smartCategorizeBtn');
  const btnThemeSelect = document.getElementById('btnTheme');
  const btnPreview = document.getElementById('btnPreview');
  const btnOpacityInput = document.getElementById('btnOpacity');
  const opacityVal = document.getElementById('opacityVal');
  const saveBtn = document.getElementById('saveBtn');
  const themeToggle = document.getElementById('themeToggle');
  const langToggle = document.getElementById('langToggle');
  const helpBtn = document.getElementById('helpBtn');
  const proFeaturesContainer = document.getElementById('proFeatures');
  const previewChat = document.getElementById('previewChat');
  const previewInput = document.getElementById('previewInput');
  const previewSendBtn = document.getElementById('previewSendBtn');

  // Stats elements
  const statReplies = document.getElementById('statReplies');
  const statTimeSaved = document.getElementById('statTimeSaved');
  const statStatus = document.getElementById('statStatus');
  
  function updateStats() {
    chrome.storage.sync.get({
      totalReplies: 0,
      totalResponseTime: 0,
      successCount: 0,
      failedCount: 0,
      lastUsedModel: ''
    }, (data) => {
      const replies = data.totalReplies || 0;
      const successCount = data.successCount || 0;
      const failedCount = data.failedCount || 0;
      const totalResponseTime = data.totalResponseTime || 0;
      
      if (statReplies) statReplies.textContent = replies.toLocaleString();
      
      if (statTimeSaved) {
        const savedMinutes = Math.round(replies * 1.5);
        if (savedMinutes >= 60) {
          statTimeSaved.textContent = Math.round(savedMinutes / 60) + 'h';
        } else {
          statTimeSaved.textContent = savedMinutes + 'm';
        }
      }
      
      if (statStatus) {
        const total = successCount + failedCount;
        if (total > 0) {
          const successRate = Math.round((successCount / total) * 100);
          statStatus.textContent = successRate + '% 成功';
        } else {
          statStatus.textContent = '标准版';
        }
      }
    });
  }
  updateStats();
  
  // Weekly Statistics
  function updateWeeklyStats() {
    chrome.storage.sync.get({
      weeklyReplies: 0,
      weeklyTimeSaved: 0,
      weeklySuccessCount: 0,
      weeklyFailedCount: 0,
      weeklyModelUsage: {},
      weekStartTimestamp: Date.now() - (7 * 24 * 60 * 60 * 1000) // Default to 7 days ago
    }, (data) => {
      const weekRepliesEl = document.getElementById('weekReplies');
      const weekSavedEl = document.getElementById('weekSaved');
      const weekSuccessEl = document.getElementById('weekSuccess');
      const topModelEl = document.getElementById('topModel');
      const weeklyPanel = document.getElementById('weeklyStatsPanel');
      
      const weekReplies = data.weeklyReplies || 0;
      const weekSuccessCount = data.weeklySuccessCount || 0;
      const weekFailedCount = data.weeklyFailedCount || 0;
      const weeklyTimeSaved = data.weeklyTimeSaved || 0;
      const weeklyModelUsage = data.weeklyModelUsage || {};
      
      // Only show panel if there's data
      if (weekReplies > 0 || weekSuccessCount > 0 || weekFailedCount > 0) {
        if (weeklyPanel) weeklyPanel.style.display = 'block';
      }
      
      // Update weekly replies
      if (weekRepliesEl) {
        weekRepliesEl.textContent = weekReplies.toLocaleString();
      }
      
      // Update time saved
      if (weekSavedEl) {
        if (weeklyTimeSaved >= 60) {
          weekSavedEl.textContent = Math.round(weeklyTimeSaved / 60) + 'h';
        } else {
          weekSavedEl.textContent = Math.round(weeklyTimeSaved) + 'm';
        }
      }
      
      // Update success rate
      if (weekSuccessEl) {
        const total = weekSuccessCount + weekFailedCount;
        if (total > 0) {
          const successRate = Math.round((weekSuccessCount / total) * 100);
          weekSuccessEl.textContent = successRate + '%';
        } else {
          weekSuccessEl.textContent = '-';
        }
      }
      
      // Update most used model
      if (topModelEl) {
        let topModel = '-';
        let maxUsage = 0;
        Object.entries(weeklyModelUsage).forEach(([model, count]) => {
          if (count > maxUsage) {
            maxUsage = count;
            topModel = model;
          }
        });
        
        // Shorten model name for display
        if (topModel !== '-') {
          if (topModel.includes('/')) {
            topModel = topModel.split('/').pop();
          }
          if (topModel.length > 20) {
            topModel = topModel.substring(0, 20) + '...';
          }
        }
        topModelEl.textContent = topModel;
      }
    });
  }
  updateWeeklyStats();
  
  function renderProFeatures() {
    proFeaturesContainer.innerHTML = '';
    const features = I18N[currentLang].proFeatures;
    features.forEach(f => {
      const card = document.createElement('div');
      card.className = 'pro-feature';
      card.innerHTML = '<div class="pro-feature-icon">' + f.icon + '</div>' +
                       '<div class="pro-feature-text"><h4>' + f.title + '</h4><p>' + f.desc + '</p></div>';
      proFeaturesContainer.appendChild(card);
    });
  }

  function addPreviewMessage(text, type) {
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble ' + type;
    bubble.textContent = text;
    previewChat.appendChild(bubble);
    previewChat.scrollTop = previewChat.scrollHeight;
  }

  previewSendBtn.addEventListener('click', async () => {
    const text = previewInput.value.trim();
    if (!text) return;
    
    addPreviewMessage(text, 'user');
    previewInput.value = '';
    
    // Show thinking indicator
    const thinkingBubble = document.createElement('div');
    thinkingBubble.className = 'chat-bubble ai';
    thinkingBubble.innerHTML = '<span style="opacity: 0.5;">AI 思考中...</span>';
    previewChat.appendChild(thinkingBubble);
    previewChat.scrollTop = previewChat.scrollHeight;
    
    // Build context for preview
    const existingMessages = [];
    const allBubbles = previewChat.querySelectorAll('.chat-bubble');
    allBubbles.forEach((bubble, index) => {
      if (bubble !== thinkingBubble) {
        existingMessages.push({
          role: bubble.classList.contains('user') ? 'user' : 'assistant',
          content: bubble.textContent
        });
      }
    });
    
    // Get settings and call API
    chrome.storage.sync.get(['apiKey', 'apiUrl', 'modelName', 'personas', 'activePersonaId', 'tone', 'replyLength', 'faqData'], async (data) => {
      if (!data.apiKey) {
        thinkingBubble.innerHTML = '<span style="color: var(--error);">请先配置 API Key</span>';
        return;
      }
      
      try {
        // Build system instruction
        let systemInstruction = 'You are a helpful assistant.';
        
        if (data.personas && data.activePersonaId) {
          const activePersona = data.personas.find(p => p.id === data.activePersonaId);
          if (activePersona && activePersona.prompt) {
            systemInstruction = activePersona.prompt;
          }
        }
        
        if (data.tone && data.tone !== 'auto') {
          systemInstruction += '\n\nPlease reply with a ' + data.tone + ' tone.';
        }
        
        systemInstruction += '\n\nCRITICAL: Detect the language of the last message and reply in that SAME language automatically.';
        
        if (data.replyLength && data.replyLength !== 'auto') {
          const lengthMap = { short: '1-2 sentences', medium: '2-4 sentences', long: 'detailed' };
          systemInstruction += '\n\nPlease provide a ' + lengthMap[data.replyLength] + ' response.';
        }
        
        const messages = [
          { role: 'system', content: systemInstruction },
          ...existingMessages
        ];
        
        let apiUrl = (data.apiUrl || 'https://api.openai.com/v1/chat/completions').replace(/\/+$/, '');
        if (!apiUrl.endsWith('/chat/completions') && !apiUrl.endsWith('/messages')) {
          apiUrl += '/chat/completions';
        }
        
        const bodyData = {
          model: data.modelName || 'gpt-3.5-turbo',
          messages: messages
        };
        
        if (!bodyData.model.startsWith('o1') && !bodyData.model.startsWith('o3')) {
          bodyData.temperature = 0.7;
        }
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.apiKey.trim()}`
          },
          body: JSON.stringify(bodyData)
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `HTTP ${response.status}`);
        }
        
        const result = await response.json();
        let reply = 'No reply generated.';
        
        if (result.choices && result.choices.length > 0) {
          reply = result.choices[0].message?.content || result.choices[0].text || '';
        } else if (result.content && result.content.length > 0) {
          reply = result.content[0].text || '';
        } else if (result.message && result.message.content) {
          reply = result.message.content;
        }
        
        thinkingBubble.textContent = reply.trim();
        thinkingBubble.style.opacity = '1';
        
      } catch (error) {
        thinkingBubble.innerHTML = '<span style="color: var(--error);">错误: ' + error.message + '</span>';
      }
    });
  });

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
  let currentTheme = 'dark';
  let faqData = [];
  let personas = [];
  let activePersonaId = null;

  function generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  function renderPersonas() {
    personaList.innerHTML = '';
    
    // Filter personas based on search query
    const filteredPersonas = personas.filter(persona => {
      if (!personaSearchQuery) return true;
      const query = personaSearchQuery.toLowerCase();
      const nameMatch = persona.name.toLowerCase().includes(query);
      const promptMatch = persona.prompt.toLowerCase().includes(query);
      return nameMatch || promptMatch;
    });
    
    if (filteredPersonas.length === 0 && personas.length > 0) {
      // Show no results message
      const noResults = document.createElement('div');
      noResults.className = 'persona-no-results';
      noResults.style.cssText = 'padding: 24px; text-align: center; color: var(--text-tertiary); font-size: 14px;';
      noResults.textContent = currentLang === 'zh' ? '没有找到匹配的角色' : 'No matching personas found';
      personaList.appendChild(noResults);
      return;
    }
    
    filteredPersonas.forEach((persona) => {
      const index = personas.findIndex(p => p.id === persona.id);
      const card = document.createElement('div');
      card.className = 'persona-card' + (persona.id === activePersonaId ? ' active' : '');

      const header = document.createElement('div');
      header.className = 'persona-card-header';

      // Avatar
      const avatar = document.createElement('div');
      avatar.className = 'persona-avatar';
      avatar.textContent = '🤖';

      // Info section
      const info = document.createElement('div');
      info.className = 'persona-info';

      // Name input
      const nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.className = 'persona-name-input';
      nameInput.placeholder = currentLang === 'zh' ? '角色名称' : 'Persona Name';
      nameInput.value = persona.name;
      nameInput.onchange = (e) => { personas[index].name = e.target.value; };

      // Status badge
      const status = document.createElement('div');
      status.className = 'persona-status' + (persona.id === activePersonaId ? ' active' : '');
      status.innerHTML = '<span class="persona-status-dot"></span><span>' +
        (persona.id === activePersonaId
          ? (currentLang === 'zh' ? '当前使用' : 'Active')
          : (currentLang === 'zh' ? '未激活' : 'Inactive')) +
        '</span>';

      info.appendChild(nameInput);
      info.appendChild(status);

      // Actions
      const actions = document.createElement('div');
      actions.className = 'persona-actions';

      // Edit button
      const editBtn = document.createElement('button');
      editBtn.className = 'persona-action-btn';
      editBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>';
      editBtn.title = currentLang === 'zh' ? '编辑角色' : 'Edit Persona';
      editBtn.onclick = () => {
        const promptInput = card.querySelector('.persona-prompt-input');
        if (promptInput) {
          promptInput.focus();
        }
      };

      // Delete button
      const delBtn = document.createElement('button');
      delBtn.className = 'persona-action-btn delete';
      delBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
      delBtn.title = currentLang === 'zh' ? '删除角色' : 'Delete Persona';
      delBtn.onclick = () => {
        if (confirm(currentLang === 'zh' ? '确定要删除这个角色吗？' : 'Are you sure you want to delete this persona?')) {
          personas.splice(index, 1);
          if (activePersonaId === persona.id) {
            activePersonaId = personas.length > 0 ? personas[0].id : null;
          }
          renderPersonas();
        }
      };

      actions.appendChild(editBtn);
      actions.appendChild(delBtn);

      header.appendChild(avatar);
      header.appendChild(info);
      header.appendChild(actions);

      // Prompt textarea
      const promptInput = document.createElement('textarea');
      promptInput.className = 'persona-prompt-input';
      promptInput.placeholder = currentLang === 'zh' ? '系统提示词 (Prompt)\n\n例如：你是一个专业的客服代表，负责解答客户关于产品的疑问...' : 'System Prompt\n\nExample: You are a professional customer service representative...';
      promptInput.value = persona.prompt;
      promptInput.onchange = (e) => { personas[index].prompt = e.target.value; };

      // Toggle button
      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'persona-toggle-btn';
      toggleBtn.textContent = persona.id === activePersonaId
        ? (currentLang === 'zh' ? '✓ 当前激活' : '✓ Active')
        : (currentLang === 'zh' ? '切换为当前角色' : 'Set as Active');
      if (persona.id !== activePersonaId) {
        toggleBtn.onclick = () => {
          activePersonaId = persona.id;
          addToRecentPersonas(persona);
          renderPersonas();
          renderRecentTags();
        };
      }

      card.appendChild(header);
      card.appendChild(promptInput);
      card.appendChild(toggleBtn);
      personaList.appendChild(card);
    });
  }

  addPersonaBtn.addEventListener('click', () => {
    const newId = generateId();
    personas.push({ id: newId, name: '', prompt: '' });
    if (!activePersonaId) activePersonaId = newId;
    renderPersonas();
  });

  // Recent Personas functionality
  function addToRecentPersonas(persona) {
    // Remove if already exists
    recentPersonas = recentPersonas.filter(p => p.id !== persona.id);
    // Add to front (max 5 recent personas)
    recentPersonas.unshift(persona);
    if (recentPersonas.length > 5) {
      recentPersonas.pop();
    }
    // Save to storage
    chrome.storage.sync.set({ recentPersonas });
  }

  function renderRecentTags() {
    if (!recentTagsContainer || !recentTags) return;
    
    if (recentPersonas.length === 0) {
      recentTagsContainer.style.display = 'none';
      return;
    }
    
    recentTagsContainer.style.display = 'flex';
    recentTags.innerHTML = '';
    
    recentPersonas.forEach(persona => {
      const tag = document.createElement('div');
      tag.className = 'recent-tag' + (persona.id === activePersonaId ? ' active' : '');
      tag.innerHTML = `
        <svg class="recent-tag-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <span>${persona.name || '未命名角色'}</span>
      `;
      tag.onclick = () => {
        activePersonaId = persona.id;
        addToRecentPersonas(persona);
        renderPersonas();
        renderRecentTags();
      };
      recentTags.appendChild(tag);
    });
  }

  // Persona Search functionality
  if (personaSearchInput) {
    personaSearchInput.addEventListener('input', (e) => {
      personaSearchQuery = e.target.value.trim();
      renderPersonas();
    });
  }

  // Template Library functionality
  const templateLibraryBtn = document.getElementById('templateLibraryBtn');
  const templateModal = document.getElementById('templateModal');
  const templateGrid = document.getElementById('templateGrid');
  const closeTemplateBtn = document.getElementById('closeTemplateBtn');

  function renderTemplateLibrary() {
    if (!templateGrid) return;
    templateGrid.innerHTML = '';

    PERSONA_TEMPLATES.forEach(template => {
      const card = document.createElement('div');
      card.className = 'template-card';

      const header = document.createElement('div');
      header.className = 'template-card-header';

      const icon = document.createElement('div');
      icon.className = 'template-card-icon';
      icon.textContent = template.icon;

      const name = document.createElement('div');
      name.className = 'template-card-name';
      name.textContent = I18N[currentLang][template.nameKey] || template.nameKey;

      header.appendChild(icon);
      header.appendChild(name);

      const desc = document.createElement('div');
      desc.className = 'template-card-desc';
      desc.textContent = I18N[currentLang][template.descKey] || template.descKey;

      const btn = document.createElement('button');
      btn.className = 'template-card-btn';
      btn.textContent = I18N[currentLang].useTemplate || 'Use Template';
      btn.onclick = () => useTemplate(template);

      card.appendChild(header);
      card.appendChild(desc);
      card.appendChild(btn);
      templateGrid.appendChild(card);
    });
  }

  function useTemplate(template) {
    const newId = generateId();
    const newPersona = {
      id: newId,
      name: I18N[currentLang][template.nameKey] || template.nameKey,
      prompt: template.prompt
    };
    personas.push(newPersona);
    if (!activePersonaId) activePersonaId = newId;
    renderPersonas();

    // Close modal
    if (templateModal) templateModal.classList.remove('show');

    showToast(currentLang === 'zh'
      ? `已添加模板：${newPersona.name}`
      : `Template added: ${newPersona.name}`);
  }

  if (templateLibraryBtn) {
    templateLibraryBtn.addEventListener('click', () => {
      renderTemplateLibrary();
      if (templateModal) templateModal.classList.add('show');
    });
  }

  if (closeTemplateBtn) {
    closeTemplateBtn.addEventListener('click', () => {
      if (templateModal) templateModal.classList.remove('show');
    });
  }

  // Close template modal when clicking outside
  if (templateModal) {
    templateModal.addEventListener('click', (e) => {
      if (e.target === templateModal) {
        templateModal.classList.remove('show');
      }
    });
  }

  function renderFaq() {
    faqList.innerHTML = '';

    // Filter FAQ data based on search and category
    const filteredFaq = faqData.filter((item) => {
      // Category filter
      if (faqCategoryQuery !== 'all' && item.category !== faqCategoryQuery) {
        return false;
      }
      // Search filter
      if (faqSearchQuery) {
        const query = faqSearchQuery.toLowerCase();
        const qMatch = item.q.toLowerCase().includes(query);
        const aMatch = item.a.toLowerCase().includes(query);
        return qMatch || aMatch;
      }
      return true;
    });

    if (filteredFaq.length === 0 && faqData.length > 0) {
      // Show no results message
      const noResults = document.createElement('div');
      noResults.className = 'faq-no-results';
      noResults.style.cssText = 'padding: 24px; text-align: center; color: var(--text-tertiary); font-size: 14px;';
      noResults.textContent = currentLang === 'zh' ? '没有找到匹配的问答' : 'No matching Q&A found';
      faqList.appendChild(noResults);
      return;
    }

    // Render filtered FAQ items (use original index for data binding)
    faqData.forEach((item, index) => {
      // Check if this item should be displayed
      if (faqCategoryQuery !== 'all' && item.category !== faqCategoryQuery) return;
      if (faqSearchQuery) {
        const query = faqSearchQuery.toLowerCase();
        if (!item.q.toLowerCase().includes(query) && !item.a.toLowerCase().includes(query)) return;
      }

      const div = document.createElement('div');
      div.className = 'faq-item';
      div.dataset.index = index;

      // Add checkbox for batch operations
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'faq-item-checkbox';
      checkbox.id = 'faq-' + index;
      checkbox.checked = selectedFaqIndices.has(index);
      checkbox.onchange = (e) => {
        if (e.target.checked) {
          selectedFaqIndices.add(index);
        } else {
          selectedFaqIndices.delete(index);
        }
        updateBatchToolbar();
      };
      div.appendChild(checkbox);

      // Category tag and selector row
      const headerRow = document.createElement('div');
      headerRow.className = 'faq-item-header';

      // Category tag
      const catTag = document.createElement('span');
      catTag.className = 'faq-category-tag';
      const catKey = item.category || 'other';
      const catInfo = FAQ_CATEGORIES[catKey] || FAQ_CATEGORIES.other;
      catTag.textContent = catInfo.label;
      catTag.style.background = catInfo.color + '20';
      catTag.style.color = catInfo.color;

      // Category selector
      const catSelect = document.createElement('select');
      catSelect.className = 'faq-item-input';
      catSelect.style.cssText = 'width: auto; min-width: 100px; margin-left: 8px; flex: 0;';
      Object.entries(FAQ_CATEGORIES).forEach(([key, info]) => {
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = info.label;
        if (key === (item.category || 'other')) opt.selected = true;
        catSelect.appendChild(opt);
      });
      catSelect.onchange = (e) => {
        faqData[index].category = e.target.value;
        // Update tag display
        const newCatInfo = FAQ_CATEGORIES[e.target.value];
        catTag.textContent = newCatInfo.label;
        catTag.style.background = newCatInfo.color + '20';
        catTag.style.color = newCatInfo.color;
      };

      // Delete button
      const delBtn = document.createElement('button');
      delBtn.className = 'item-delete';
      delBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
      delBtn.onclick = () => {
        if (confirm(currentLang === 'zh' ? '确定删除此问答？' : 'Delete this Q&A?')) {
          faqData.splice(index, 1);
          renderFaq();
        }
      };

      headerRow.appendChild(catTag);
      headerRow.appendChild(catSelect);
      headerRow.appendChild(delBtn);
      div.appendChild(headerRow);

      // Question input
      const qInput = document.createElement('input');
      qInput.className = 'faq-item-input question';
      qInput.placeholder = currentLang === 'zh' ? '问题 (Question)' : 'Question';
      qInput.value = item.q;
      qInput.style.marginBottom = '8px';
      qInput.onchange = (e) => { faqData[index].q = e.target.value; };

      // Answer textarea
      const aInput = document.createElement('textarea');
      aInput.className = 'faq-item-input';
      aInput.placeholder = currentLang === 'zh' ? '答案 (Answer)' : 'Answer';
      aInput.value = item.a;
      aInput.rows = 3;
      aInput.onchange = (e) => { faqData[index].a = e.target.value; };

      div.appendChild(qInput);
      div.appendChild(aInput);
      faqList.appendChild(div);
    });
    
    // Update batch toolbar after rendering
    updateBatchToolbar();
  }

  // FAQ Search and Filter event listeners
  if (faqSearchInput) {
    faqSearchInput.addEventListener('input', (e) => {
      faqSearchQuery = e.target.value.trim();
      renderFaq();
    });
  }

  if (faqCategoryFilter) {
    faqCategoryFilter.addEventListener('change', (e) => {
      faqCategoryQuery = e.target.value;
      renderFaq();
    });
  }

  // Batch Operations Functions
  function updateBatchToolbar() {
    if (!faqBatchToolbar || !batchCount) return;
    
    const count = selectedFaqIndices.size;
    batchCount.textContent = '已选 ' + count + ' 项';
    
    // Show/hide toolbar based on selection
    if (count > 0) {
      faqBatchToolbar.style.display = 'flex';
    } else {
      faqBatchToolbar.style.display = 'none';
    }
    
    // Update select all checkbox
    const visibleItems = faqList.querySelectorAll('.faq-item');
    const allVisibleSelected = visibleItems.length > 0 && 
      Array.from(visibleItems).every(item => {
        const checkbox = item.querySelector('.faq-item-checkbox');
        return checkbox && checkbox.checked;
      });
    
    if (faqSelectAll) {
      faqSelectAll.checked = allVisibleSelected;
    }
  }

  // Select All functionality
  if (faqSelectAll) {
    faqSelectAll.addEventListener('change', (e) => {
      const checkboxes = faqList.querySelectorAll('.faq-item-checkbox');
      checkboxes.forEach(cb => {
        cb.checked = e.target.checked;
        const index = parseInt(cb.id.replace('faq-', ''));
        if (e.target.checked) {
          selectedFaqIndices.add(index);
        } else {
          selectedFaqIndices.delete(index);
        }
      });
      updateBatchToolbar();
    });
  }

  // Batch Delete
  if (batchDeleteBtn) {
    batchDeleteBtn.addEventListener('click', () => {
      if (selectedFaqIndices.size === 0) return;
      
      const count = selectedFaqIndices.size;
      if (confirm(currentLang === 'zh' ? 
        '确定要删除选中的 ' + count + ' 条问答吗？' : 
        'Are you sure you want to delete ' + count + ' selected Q&A items?')) {
        
        // Remove selected items (sort indices in descending order to avoid index shifting)
        const sortedIndices = Array.from(selectedFaqIndices).sort((a, b) => b - a);
        sortedIndices.forEach(index => {
          faqData.splice(index, 1);
        });
        
        selectedFaqIndices.clear();
        renderFaq();
        updateBatchToolbar();
        showToast(currentLang === 'zh' ? 
          '已删除 ' + count + ' 条问答' : 
          'Deleted ' + count + ' Q&A items');
      }
    });
  }

  // Batch Category Change
  if (batchCategorySelect) {
    batchCategorySelect.addEventListener('change', (e) => {
      const category = e.target.value;
      if (!category || selectedFaqIndices.size === 0) return;
      
      selectedFaqIndices.forEach(index => {
        if (faqData[index]) {
          faqData[index].category = category;
        }
      });
      
      e.target.value = ''; // Reset select
      renderFaq();
      updateBatchToolbar();
      showToast(currentLang === 'zh' ? 
        '已更新 ' + selectedFaqIndices.size + ' 条问答的分类' : 
        'Updated category for ' + selectedFaqIndices.size + ' Q&A items');
    });
  }

  // Smart Categorize - Auto-categorize based on question content
  if (smartCategorizeBtn) {
    smartCategorizeBtn.addEventListener('click', () => {
      let changedCount = 0;
      
      faqData.forEach((item, index) => {
        const question = item.q.toLowerCase();
        const answer = item.a.toLowerCase();
        const text = question + ' ' + answer;
        
        // Keyword-based categorization
        let predictedCategory = 'other';
        
        // Price-related keywords
        if (/\b(price|cost|payment|pay|cheap|expensive|discount|refund|currency|美元 | 价格 | 费用 | 付款 | 支付 | 便宜 | 贵 | 折扣 | 退款|钱)\b/i.test(text)) {
          predictedCategory = 'price';
        }
        // Product-related keywords
        else if (/\b(product|item|feature|specification|size|color|material|quality|warranty|产品 | 商品 | 物品 | 功能 | 规格 | 尺寸 | 颜色 | 材质 | 质量 | 保修 | 型号)\b/i.test(text)) {
          predictedCategory = 'product';
        }
        // Service-related keywords
        else if (/\b(service|support|help|return|exchange|shipping|delivery|track|warranty|repair|服务 | 支持 | 帮助 | 退货 | 换货 | 发货 | 物流 | 跟踪 | 维修 | 售后)\b/i.test(text)) {
          predictedCategory = 'service';
        }
        
        // Update if different and not manually set
        if (item.category !== predictedCategory) {
          item.category = predictedCategory;
          changedCount++;
        }
      });
      
      renderFaq();
      showToast(currentLang === 'zh' ? 
        '智能分类完成！更新了 ' + changedCount + ' 条问答' : 
        'Smart categorization complete! Updated ' + changedCount + ' items');
    });
  }

  addFaqBtn.addEventListener('click', () => {
    faqData.push({ q: '', a: '', category: 'other' });
    renderFaq();
  });

  // FAQ Import/Export functionality
  importFaqBtn.addEventListener('click', () => {
    faqFileInput.click();
  });

  faqFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (Array.isArray(imported)) {
          const validItems = imported.filter(item => item.q && item.a).map(item => ({
              ...item,
              category: item.category || 'other'
            }));
          if (validItems.length > 0) {
            faqData = [...faqData, ...validItems];
            renderFaq();
            showToast(currentLang === 'zh' 
              ? `成功导入 ${validItems.length} 条问答` 
              : `Imported ${validItems.length} Q&A items`);
          } else {
            showToast(currentLang === 'zh' ? '文件中没有有效的问答数据' : 'No valid Q&A items found', true);
          }
        } else {
          showToast(currentLang === 'zh' ? '文件格式不正确' : 'Invalid file format', true);
        }
      } catch (err) {
        showToast(currentLang === 'zh' ? '解析JSON失败' : 'Failed to parse JSON', true);
      }
    };
    reader.readAsText(file);
    faqFileInput.value = '';
  });

  exportFaqBtn.addEventListener('click', () => {
    const validFaq = faqData.filter(f => f.q.trim() && f.a.trim());
    if (validFaq.length === 0) {
      showToast(currentLang === 'zh' ? '没有可导出的问答' : 'No Q&A items to export', true);
      return;
    }

    const dataStr = JSON.stringify(validFaq, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `faq-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(currentLang === 'zh' 
      ? `已导出 ${validFaq.length} 条问答` 
      : `Exported ${validFaq.length} Q&A items`);
  });

  shortcutInput.addEventListener('keydown', (e) => {
    e.preventDefault();
    if (e.key === 'Backspace' || e.key === 'Delete') {
      shortcutInput.value = '';
      return;
    }
    const keys = [];
    if (e.ctrlKey) keys.push('Ctrl');
    if (e.altKey) keys.push('Alt');
    if (e.shiftKey) keys.push('Shift');
    if (e.metaKey) keys.push('Cmd');
    if (e.key !== 'Control' && e.key !== 'Alt' && e.key !== 'Shift' && e.key !== 'Meta') {
      keys.push(e.key.toUpperCase());
    }
    if (keys.length > 0) {
      shortcutInput.value = keys.join(' + ');
    }
  });

  function applyI18n() {
    document.documentElement.lang = currentLang === 'zh' ? 'zh-CN' : 'en';
    langToggle.textContent = currentLang === 'zh' ? 'EN' : '中';
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (I18N[currentLang][key]) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = I18N[currentLang][key];
        } else if (key === 'instructionsContent') {
          el.innerHTML = I18N[currentLang][key];
        } else if (key !== 'proFeatures') {
          el.textContent = I18N[currentLang][key];
        }
      }
    });
    renderPersonas();
    renderFaq();
    renderProFeatures();
  }

  function showToast(msg, isError = false) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');
    toastMsg.textContent = msg;
    toast.className = isError ? 'error show' : 'show';
    setTimeout(() => { toast.className = toast.className.replace('show', '').trim(); }, 2500);
  }

  btnOpacityInput.addEventListener('input', (e) => {
    opacityVal.textContent = e.target.value + '%';
    btnPreview.style.opacity = e.target.value / 100;
  });

  btnThemeSelect.addEventListener('change', (e) => {
    btnPreview.className = 'preview-btn theme-' + e.target.value;
  });

  themeToggle.addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    themeToggle.textContent = currentTheme === 'dark' ? '🌙' : '☀️';
    chrome.storage.sync.set({ theme: currentTheme });
  });

  langToggle.addEventListener('click', () => {
    currentLang = currentLang === 'zh' ? 'en' : 'zh';
    chrome.storage.sync.set({ lang: currentLang });
    applyI18n();
  });

  // Load saved settings
  chrome.storage.sync.get({
    personas: [
      { id: 'default', name: '默认角色模板 (Default Template)', prompt: '【填写指南】\n请在此处描述您的AI角色设定。例如：\n1. 您的身份（如：某公司的销售经理、客服代表）。\n2. 您的目标（如：解答客户疑问、引导客户下单、询问客户的具体需求）。\n3. 您的语气（如：专业、热情、幽默）。\n4. 必须包含的信息（如：产品类型、发货港口、数量等）。\n\n【示例】\n你是[XXX公司]的客户经理[你的名字]。请根据客户的消息上下文进行专业、礼貌的回复。在对话的适当阶段，你需要引导并询问客户对于[你的产品]的具体需求，例如：具体需要什么类型的？发往哪个港口？具体的吨位是多少？发货形式是CIF还是FOB等等。' }
    ],
    activePersonaId: 'default',
    shortcut: 'Alt + 1',
    tone: 'auto',
    replyLength: 'auto',
    faqData: [],
    btnTheme: 'gradient',
    btnOpacity: 100,
    theme: 'light',
    lang: 'zh'
  }, (data) => {
    currentTheme = data.theme;
    currentLang = data.lang;
    document.documentElement.setAttribute('data-theme', currentTheme);
    themeToggle.textContent = currentTheme === 'dark' ? '🌙' : '☀️';
    applyI18n();

    personas = data.personas || [];
    activePersonaId = data.activePersonaId;
    if (personas.length > 0 && !activePersonaId) {
      activePersonaId = personas[0].id;
    }
    // Load recent personas
    recentPersonas = data.recentPersonas || [];
    renderPersonas();
    renderFaq();
    renderProFeatures();
    renderRecentTags();

    shortcutInput.value = data.shortcut;
    toneSelect.value = data.tone;
    replyLengthSelect.value = data.replyLength;
    faqData = data.faqData || [];
    renderFaq();

    btnThemeSelect.value = data.btnTheme;
    btnPreview.className = 'preview-btn theme-' + data.btnTheme;
    
    btnOpacityInput.value = data.btnOpacity;
    opacityVal.textContent = data.btnOpacity + '%';
    btnPreview.style.opacity = data.btnOpacity / 100;
    
    // Update shortcut display in quick start guide
    const shortcutDisplay = document.getElementById('shortcutDisplay');
    if (shortcutDisplay && data.shortcut) {
      shortcutDisplay.textContent = data.shortcut;
    }
  });

  // Replay Onboarding functionality
  const replayOnboardingBtn = document.getElementById('replayOnboardingBtn');
  if (replayOnboardingBtn) {
    replayOnboardingBtn.addEventListener('click', () => {
      if (confirm(currentLang === 'zh' ? 
        '确定要重新播放新手引导吗？' : 
        'Are you sure you want to replay the onboarding tour?')) {
        
        // Reset onboarding flag
        chrome.storage.sync.set({ onboardingCompleted: false }, () => {
          // Reload page to trigger onboarding
          location.reload();
        });
      }
    });
  }

  const upgradeBtn = document.getElementById('upgradeBtn');
  upgradeBtn.addEventListener('click', () => {
    const msg = currentLang === 'zh' ? '正在跳转至支付页面...' : 'Redirecting to payment page...';
    showToast(msg);
    setTimeout(() => {
      alert(currentLang === 'zh' ? '演示版：支付功能即将上线！' : 'Demo: Payment feature coming soon!');
    }, 1000);
  });

  saveBtn.addEventListener('click', () => {
    const shortcut = shortcutInput.value.trim();
    const tone = toneSelect.value;
    const replyLength = replyLengthSelect.value;
    const btnTheme = btnThemeSelect.value;
    const btnOpacity = parseInt(btnOpacityInput.value, 10);

    // Filter out empty personas and FAQs
    const validPersonas = personas.filter(p => p.name.trim() || p.prompt.trim());
    const validFaq = faqData.filter(f => f.q.trim() || f.a.trim());

    saveBtn.disabled = true;
    saveBtn.style.opacity = '0.7';

    chrome.storage.sync.set({
      personas: validPersonas,
      activePersonaId,
      shortcut,
      tone,
      replyLength,
      faqData: validFaq,
      btnTheme,
      btnOpacity,
      theme: currentTheme,
      lang: currentLang,
      recentPersonas
    }, () => {
      showToast(I18N[currentLang].saved);
      saveBtn.disabled = false;
      saveBtn.style.opacity = '1';
      // Re-render to show cleaned up lists
      personas = validPersonas;
      faqData = validFaq;
      selectedFaqIndices.clear(); // Clear selection on save
      renderPersonas();
      renderFaq();
    });
  });

  // Onboarding Tour functionality
  const onboardingOverlay = document.getElementById('onboardingOverlay');
  const onboardingSpotlight = document.getElementById('onboardingSpotlight');
  const onboardingTooltip = document.getElementById('onboardingTooltip');
  const onboardingStepNumber = document.getElementById('onboardingStepNumber');
  const onboardingTitle = document.getElementById('onboardingTitle');
  const onboardingDesc = document.getElementById('onboardingDesc');
  const onboardingProgress = document.getElementById('onboardingProgress');
  const onboardingSkip = document.getElementById('onboardingSkip');
  const onboardingNext = document.getElementById('onboardingNext');

  let currentOnboardingStep = 0;

  function startOnboarding() {
    currentOnboardingStep = 0;
    if (onboardingOverlay) onboardingOverlay.classList.add('show');
    renderOnboardingStep();
  }

  function renderOnboardingStep() {
    if (!onboardingOverlay || currentOnboardingStep >= ONBOARDING_STEPS.length) {
      endOnboarding();
      return;
    }

    const step = ONBOARDING_STEPS[currentOnboardingStep];
    const targetEl = document.querySelector(step.target);

    // Update tooltip content
    if (onboardingStepNumber) onboardingStepNumber.textContent = currentOnboardingStep + 1;
    if (onboardingTitle) onboardingTitle.textContent = I18N[currentLang][step.titleKey] || step.titleKey;
    if (onboardingDesc) onboardingDesc.textContent = I18N[currentLang][step.descKey] || step.descKey;

    // Update button text
    if (onboardingNext) {
      if (currentOnboardingStep === ONBOARDING_STEPS.length - 1) {
        onboardingNext.textContent = I18N[currentLang].onboardingFinish || '完成';
        onboardingNext.className = 'onboarding-btn onboarding-btn-finish';
      } else {
        onboardingNext.textContent = I18N[currentLang].onboardingNext || '下一步';
        onboardingNext.className = 'onboarding-btn onboarding-btn-next';
      }
    }

    // Update progress dots
    if (onboardingProgress) {
      onboardingProgress.innerHTML = '';
      ONBOARDING_STEPS.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.className = 'onboarding-dot';
        if (index < currentOnboardingStep) dot.classList.add('completed');
        if (index === currentOnboardingStep) dot.classList.add('active');
        onboardingProgress.appendChild(dot);
      });
    }

    // Position spotlight and tooltip
    if (targetEl && onboardingSpotlight && onboardingTooltip) {
      const rect = targetEl.getBoundingClientRect();
      const padding = 8;

      // Position spotlight
      onboardingSpotlight.style.top = (rect.top - padding) + 'px';
      onboardingSpotlight.style.left = (rect.left - padding) + 'px';
      onboardingSpotlight.style.width = (rect.width + padding * 2) + 'px';
      onboardingSpotlight.style.height = (rect.height + padding * 2) + 'px';

      // Position tooltip below target
      const tooltipWidth = 360;
      let tooltipTop = rect.bottom + 16;
      let tooltipLeft = rect.left + (rect.width / 2) - (tooltipWidth / 2);

      // Keep tooltip within viewport
      if (tooltipLeft < 16) tooltipLeft = 16;
      if (tooltipLeft + tooltipWidth > window.innerWidth - 16) {
        tooltipLeft = window.innerWidth - tooltipWidth - 16;
      }
      if (tooltipTop + 200 > window.innerHeight) {
        tooltipTop = rect.top - 220;
      }

      onboardingTooltip.style.top = tooltipTop + 'px';
      onboardingTooltip.style.left = tooltipLeft + 'px';
    }
  }

  function endOnboarding() {
    if (onboardingOverlay) onboardingOverlay.classList.remove('show');
    chrome.storage.sync.set({ onboardingCompleted: true });
  }

  if (onboardingSkip) {
    onboardingSkip.addEventListener('click', endOnboarding);
  }

  if (onboardingNext) {
    onboardingNext.addEventListener('click', () => {
      currentOnboardingStep++;
      renderOnboardingStep();
    });
  }

  // Check if onboarding should be shown
  chrome.storage.sync.get({ onboardingCompleted: false }, (data) => {
    if (!data.onboardingCompleted) {
      // Delay slightly to ensure DOM is ready
      setTimeout(startOnboarding, 500);
    }
  });

  const proBtn = document.querySelector('.pro-btn');
  if (proBtn) {
    proBtn.addEventListener('click', () => {
      showToast(currentLang === 'zh' ? '即将推出支付宝付款功能，敬请期待！' : 'Alipay payment integration coming soon!');
    });
  }
});