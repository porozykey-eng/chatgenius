const I18N = {
  // SYNC: Backend API base URL - must match across all files (background.js, options.js)
  API_BASE_URL: 'https://chat.sopie.cc',
  en: {
    title: 'AI Auto-Reply Settings',
    subtitle: 'Manage your AI personas, knowledge base and preferences',
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
    templateSuccessDesc: 'Dedicated manager for customer onboarding',
    tabPersonas: 'AI Personas',
    tabKnowledge: 'Knowledge Base',
    tabSettings: 'Preferences',
    weeklyStatsTitle: 'Weekly Statistics',
    weekRepliesLabel: 'Replies This Week',
    weekSavedLabel: 'Time Saved',
    weekSuccessLabel: 'Success Rate',
    topModelLabel: 'Top Model',
    quickGuideTitle: 'Quick Start Guide',
    quickGuideShortcutTitle: 'Shortcut',
    quickGuideShortcutDesc: 'Press {key} in chat to generate AI reply',
    quickGuideShortcutPrefix: 'Press ',
    quickGuideShortcutSuffix: ' in chat to generate AI reply',
    quickGuideFloatTitle: 'Floating Button',
    quickGuideFloatDesc: 'Long press 500ms to drag, short press to generate reply',
    quickGuidePersonaTitle: 'Switch Persona',
    quickGuidePersonaDesc: 'Select different personas in popup or settings',
    quickGuideKBTitle: 'Knowledge Base',
    quickGuideKBDesc: 'AI will naturally incorporate FAQ info into replies',
    activateTitle: 'Activate Product',
    activateDesc: 'Enter your activation code to unlock Pro',
    activatePlaceholder: 'Enter code (e.g. PRO-XXXX-XXXX)',
    activateBtn: 'Activate',
    activateSuccessPrefix: 'Activated! Upgraded to ',
    activateVerifying: 'Verifying...',
    activateErrorEmpty: 'Please enter activation code',
    activateErrorInvalid: 'Invalid code. Please check and try again',
    activateFail: 'Activation failed. Please check your network',
    activateLabel: 'Activate',
    redirectingPayment: 'Redirecting to payment page...',
    alipayComingSoon: 'Alipay payment coming soon!',
    pageTitle: 'ChatGenius AI - Settings',
    allCategories: 'All Categories',
    catProduct: 'Product',
    catPrice: 'Pricing',
    catService: 'Service',
    catOther: 'Other',
    batchSelectAll: 'Select All',
    batchCountPrefix: '',
    batchCountSuffix: ' selected',
    batchDelete: 'Delete',
    batchMoveTo: 'Move to category...',
    smartCategorize: 'Smart Categorize',
    personaSearchPlaceholder: 'Search name or prompt...',
    recentLabel: 'Recent:',
    sendBtn: 'Send',
    faqSearchPlaceholder: 'Search Q&A...',
    importBtn: 'Import',
    exportBtn: 'Export',
    themePreview: 'Theme Preview',
    statSuccessSuffix: '% success',
    statStandard: 'Standard',
    statFree: 'Free',
    statProLifetime: 'Pro Lifetime',
    statProYear: 'Pro Year',
    quotaTitle: 'Daily Quota Running Low',
    quotaInfo: 'Remaining today: {n} replies',
    quotaTip: 'Upgrade to Pro for unlimited replies',
    previewThinking: 'AI thinking...',
    previewError: 'Error: ',
    previewPlaceholder: 'Type a test message...',
    upgradeSection: 'Upgrade',
    proPanelDesc: 'Unlock all premium features for a better experience.',
    activationSectionTitle: 'Activation',
    shortcutHint: 'Alt+2 opens quick menu · Ctrl+Enter inserts reply · Ctrl+R regenerates',
    noMatchingPersonas: 'No matching personas found',
    noMatchingFaq: 'No matching Q&A found',
    confirmDeletePersona: 'Are you sure you want to delete this persona?',
    confirmDeleteFaq: 'Delete this Q&A?',
    confirmBatchDelete: 'Are you sure you want to delete {n} selected Q&A items?',
    deletedCount: 'Deleted {n} Q&A items',
    categoryUpdated: 'Updated category for {n} Q&A items',
    smartCategorizeDone: 'Smart categorization complete! Updated {n} items',
    importSuccess: 'Imported {n} Q&A items',
    importNoValid: 'No valid Q&A items found',
    importInvalidFormat: 'Invalid file format',
    importParseFail: 'Failed to parse JSON',
    exportSuccess: 'Exported {n} Q&A items',
    exportNone: 'No Q&A items to export',
    templateAdded: 'Template added: {name}',
    helpContent: '1. Configure API: Click the extension icon in the toolbar to set your AI Provider and API Key.<br><br>2. Set Persona: Define your custom persona below (e.g., Sales Manager, Tech Support) so the AI knows how to act.<br><br>3. Use in Chat: Open WhatsApp or Messenger web. A floating "AI Reply" button will appear. Click it (or use the shortcut) to generate a context-aware reply based on the recent chat history.<br><br><b>Quick Shortcuts:</b><br>· Shortcut key: Generate AI reply in chat<br>· Alt+2: Open quick menu<br>· Ctrl+Enter: Insert reply<br>· Ctrl+R: Regenerate reply',
    faqDeleteTitle: 'Batch Delete',
    faqSmartCatTitle: 'Smart Categorize',
    personaNamePlaceholder: 'Persona Name',
    statusActive: 'Active',
    statusInactive: 'Inactive',
    editPersona: 'Edit Persona',
    deletePersona: 'Delete Persona',
    personaPromptPlaceholder: 'System Prompt\n\nExample: You are a professional customer service representative...',
    toggleActive: '✓ Active',
    toggleSetAsActive: 'Set as Active',
    questionLabel: 'Question',
    answerLabel: 'Answer',
    freeBannerTitle: 'Current: Free Version',
    freeBannerDesc: 'Today: {used}/{limit} replies used',
    freeBannerBtn: 'Upgrade to Pro',
    upgradeModalTitle: 'Upgrade to ChatGenius Pro',
    upgradeOptCodeTitle: 'I have an activation code',
    upgradeOptCodeDesc: 'Enter activation code to upgrade',
    upgradeOptBuyTitle: 'Purchase Online',
    upgradeOptBuyDesc: 'Go to website to purchase activation code',
    modalActivateBtn: 'Activate',
    modalActivationPlaceholder: 'Enter activation code (e.g. PRO-XXXX-XXXX)',
    modalFooter: 'Enter the activation code after purchase to complete upgrade'
  },
  zh: {
    title: 'AI 自动回复设置',
    subtitle: '管理你的 AI 角色、知识库和偏好',
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
    tabPersonas: 'AI 角色',
    tabKnowledge: '知识库',
    tabSettings: '偏好设置',
    weeklyStatsTitle: '本周使用统计',
    weekRepliesLabel: '本周回复',
    weekSavedLabel: '节省时间',
    weekSuccessLabel: '成功率',
    topModelLabel: '常用模型',
    quickGuideTitle: '快捷操作指南',
    quickGuideShortcutTitle: '快捷键',
    quickGuideShortcutDesc: '在聊天窗口按 {key} 快速生成 AI 回复',
    quickGuideShortcutPrefix: '在聊天窗口按 ',
    quickGuideShortcutSuffix: ' 快速生成 AI 回复',
    quickGuideFloatTitle: '悬浮按钮',
    quickGuideFloatDesc: '长按 500ms 拖动，短按点击生成回复',
    quickGuidePersonaTitle: '切换人设',
    quickGuidePersonaDesc: '在 popup 或设置中选择不同角色，AI 会根据角色设定回复',
    quickGuideKBTitle: '知识库',
    quickGuideKBDesc: '添加 FAQ 后，AI 会自动融入这些信息到回复中',
    activateTitle: '激活产品',
    activateDesc: '输入从官网购买的激活码来解锁 Pro 版',
    activatePlaceholder: '输入激活码（例如：PRO-XXXX-XXXX）',
    activateBtn: '激活',
    activateSuccessPrefix: '激活成功！已升级到 ',
    activateVerifying: '验证中...',
    activateErrorEmpty: '请输入激活码',
    activateErrorInvalid: '激活码无效，请检查后重试',
    activateFail: '激活失败，请检查网络连接',
    activateLabel: '激活',
    redirectingPayment: '正在跳转至支付页面...',
    alipayComingSoon: '即将推出支付宝付款功能，敬请期待！',
    pageTitle: 'ChatGenius AI - 设置',
    allCategories: '全部分类',
    catProduct: '产品相关',
    catPrice: '价格咨询',
    catService: '售后服务',
    catOther: '其他',
    batchSelectAll: '全选',
    batchCountPrefix: '已选 ',
    batchCountSuffix: ' 项',
    batchDelete: '删除',
    batchMoveTo: '移动到分类...',
    smartCategorize: '智能分类',
    personaSearchPlaceholder: '搜索角色名称或提示词...',
    recentLabel: '最近使用：',
    sendBtn: '发送',
    faqSearchPlaceholder: '搜索问答...',
    importBtn: '导入',
    exportBtn: '导出',
    themePreview: '主题预览',
    statSuccessSuffix: '% 成功',
    statStandard: '标准版',
    statFree: '免费版',
    statProLifetime: 'Pro 永久版',
    statProYear: 'Pro 年付版',
    quotaTitle: '每日配额即将用完',
    quotaInfo: '今日剩余 {n} 次回复机会',
    quotaTip: '升级到 Pro 版享受无限制回复',
    previewThinking: 'AI 思考中...',
    previewError: '错误: ',
    previewPlaceholder: '输入测试消息...',
    upgradeSection: '升级',
    proPanelDesc: '解锁全部高级功能，获得更好的使用体验。',
    activationSectionTitle: '激活',
    shortcutHint: 'Alt+2 打开快捷菜单 · Ctrl+Enter 插入回复 · Ctrl+R 重新生成',
    noMatchingPersonas: '没有找到匹配的角色',
    noMatchingFaq: '没有找到匹配的问答',
    confirmDeletePersona: '确定要删除这个角色吗？',
    confirmDeleteFaq: '确定删除此问答？',
    confirmBatchDelete: '确定要删除选中的 {n} 条问答吗？',
    deletedCount: '已删除 {n} 条问答',
    categoryUpdated: '已更新 {n} 条问答的分类',
    smartCategorizeDone: '智能分类完成！更新了 {n} 条问答',
    importSuccess: '成功导入 {n} 条问答',
    importNoValid: '文件中没有有效的问答数据',
    importInvalidFormat: '文件格式不正确',
    importParseFail: '解析JSON失败',
    exportSuccess: '已导出 {n} 条问答',
    exportNone: '没有可导出的问答',
    templateAdded: '已添加模板：{name}',
    helpContent: '1. 配置 API：点击浏览器工具栏中的插件图标，设置您的 AI 提供商和 API Key。<br><br>2. 设置人设：在下方创建并选择您的专属角色（例如：销售经理、技术支持），让 AI 知道如何回复客户。<br><br>3. 在聊天中使用：打开 WhatsApp 或 Messenger 网页版。聊天窗口旁会出现一个"AI Reply"悬浮按钮。点击它（或使用快捷键）即可根据最近的聊天记录生成回复。<br><br><b>快捷操作：</b><br>· 快捷键：在聊天窗口快速生成 AI 回复<br>· Alt+2：打开快捷菜单<br>· Ctrl+Enter：插入回复<br>· Ctrl+R：重新生成回复',
    faqDeleteTitle: '批量删除',
    faqSmartCatTitle: '智能分类',
    personaNamePlaceholder: '角色名称',
    statusActive: '当前使用',
    statusInactive: '未激活',
    editPersona: '编辑角色',
    deletePersona: '删除角色',
    personaPromptPlaceholder: '系统提示词 (Prompt)\n\n例如：你是一个专业的客服代表，负责解答客户关于产品的疑问...',
    toggleActive: '✓ 当前激活',
    toggleSetAsActive: '切换为当前角色',
    questionLabel: '问题 (Question)',
    answerLabel: '答案 (Answer)',
    freeBannerTitle: '当前：免费版',
    freeBannerDesc: '今日已用 {used}/{limit} 次',
    freeBannerBtn: '✨ 升级 Pro',
    upgradeModalTitle: '升级 ChatGenius Pro',
    upgradeOptCodeTitle: '我有激活码',
    upgradeOptCodeDesc: '输入激活码直接升级',
    upgradeOptBuyTitle: '在线购买',
    upgradeOptBuyDesc: '前往官网购买激活码',
    modalActivateBtn: '激活',
    modalActivationPlaceholder: '输入激活码（如: PRO-XXXX-XXXX）',
    modalFooter: '购买后请将激活码输入上方完成升级'
  }
};

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

// SYNC: Daily usage limit for free tier - must match across all files (background.js, popup.js, options.js)
const DAILY_LIMIT = 20;

// Upgrade URL - landing page pricing section
const UPGRADE_URL = 'https://chatgenius.ai/#pricing';

// Chrome API compatibility layer for standalone preview
if (typeof chrome === 'undefined' || !chrome.storage) {
  const _mockStorage = {};
  const _mockGet = (storage) => (keys, cb) => {
    if (typeof keys === 'object' && !Array.isArray(keys)) {
      // keys is a defaults object - merge stored values with defaults
      const result = Object.assign({}, keys);
      for (const key of Object.keys(keys)) {
        if (key in _mockStorage) result[key] = _mockStorage[key];
      }
      cb && cb(result);
    } else {
      cb && cb(_mockStorage);
    }
  };
  const _mockSet = (storage) => (data, cb) => {
    Object.assign(_mockStorage, data);
    cb && cb();
  };
  const _mockRemove = (storage) => (keys, cb) => {
    if (Array.isArray(keys)) keys.forEach(k => delete _mockStorage[k]);
    else delete _mockStorage[keys];
    cb && cb();
  };
  window.chrome = {
    storage: {
      sync: {
        get: _mockGet('sync'),
        set: _mockSet('sync'),
        remove: _mockRemove('sync')
      },
      local: {
        get: _mockGet('local'),
        set: _mockSet('local'),
        remove: _mockRemove('local')
      }
    },
    runtime: {
      sendMessage: (msg, cb) => { 
        const p = Promise.resolve({ success: false, error: 'Preview not available outside extension' });
        if (typeof cb === 'function') p.then(cb);
        return p;
      },
      onMessage: { addListener: () => {} }
    },
    i18n: {
      getMessage: (key) => key,
      getUILanguage: () => 'en'
    }
  };
}

document.addEventListener('DOMContentLoaded', () => {
  // State variables - declared early to avoid TDZ issues
  let currentLang = 'zh';
  let currentTheme = 'dark';
  let faqData = [];
  let personas = [];
  let activePersonaId = null;

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

  // Switch to pending tab (from content script upgrade CTA)
  chrome.storage.local.get(['pendingOptionsTab'], (data) => {
    if (data.pendingOptionsTab) {
      const pendingTab = data.pendingOptionsTab;
      chrome.storage.local.remove('pendingOptionsTab');
      const targetBtn = document.querySelector(`.tab-btn[data-tab="${pendingTab}"]`);
      if (targetBtn) targetBtn.click();
    }
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
  function getFaqCategories() {
    return {
      product: { label: I18N[currentLang].catProduct || 'Product', color: '#667eea' },
      price: { label: I18N[currentLang].catPrice || 'Pricing', color: '#34c759' },
      service: { label: I18N[currentLang].catService || 'Service', color: '#ff9500' },
      other: { label: I18N[currentLang].catOther || 'Other', color: '#86868b' }
    };
  }

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
  const proFeaturesContainer = document.getElementById('proFeatures');
  const previewChat = document.getElementById('previewChat');
  const previewInput = document.getElementById('previewInput');
  const previewSendBtn = document.getElementById('previewSendBtn');

  // Stats elements
  const statReplies = document.getElementById('statReplies');
  const statTimeSaved = document.getElementById('statTimeSaved');
  const statStatus = document.getElementById('statStatus');
  
  function updateStats() {
    chrome.storage.local.get({
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
          statStatus.textContent = successRate + (I18N[currentLang].statSuccessSuffix || '% success');
        } else {
          statStatus.textContent = I18N[currentLang].statStandard || 'Standard';
        }
      }
    });
    
    // Show daily quota for free users
    chrome.storage.sync.get(['licenseType'], (licenseData) => {
      const licenseType = licenseData.licenseType || 'free';
      
      if (licenseType === 'free') {
        chrome.storage.local.get(['dailyReplyCount', 'lastResetDate'], (usageData) => {
          const today = new Date().toISOString().split('T')[0];
          
          // Reset if it's a new day
          if (usageData.lastResetDate !== today) {
            usageData.dailyReplyCount = 0;
          }
          
          const dailyLimit = DAILY_LIMIT;
          const used = usageData.dailyReplyCount || 0;
          const remaining = Math.max(0, dailyLimit - used);
          
          // Update status to show quota
          if (statStatus) {
            statStatus.textContent = (I18N[currentLang].statFree || 'Free') + ` ${used}/${dailyLimit}`;
          }
          
          // Show remaining quota notification if low
          if (remaining <= 5) {
            showQuotaNotification(remaining);
          }
        });
      } else {
        // Pro user - show license type
        if (statStatus) {
          statStatus.textContent = licenseType === 'lifetime' ? (I18N[currentLang].statProLifetime || 'Pro Lifetime') : (I18N[currentLang].statProYear || 'Pro Year');
        }
      }
    });
  }
  
  // Show quota notification
  function showQuotaNotification(remaining) {
    const existing = document.getElementById('quotaNotification');
    if (existing) return; // Already shown
    
    const notification = document.createElement('div');
    notification.id = 'quotaNotification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #f59e0b, #ef4444);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
    `;
    const titleDiv = document.createElement('div');
    titleDiv.style.cssText = 'font-weight: bold; margin-bottom: 4px;';
    titleDiv.textContent = '⚠️ ' + (I18N[currentLang].quotaTitle || 'Daily Quota Running Low');
    const infoDiv = document.createElement('div');
    infoDiv.style.fontSize = '14px';
    infoDiv.textContent = (I18N[currentLang].quotaInfo || 'Remaining: {n}').replace('{n}', remaining);
    const tipDiv = document.createElement('div');
    tipDiv.style.cssText = 'font-size: 12px; margin-top: 4px; opacity: 0.8;';
    tipDiv.textContent = I18N[currentLang].quotaTip || 'Upgrade to Pro';
    notification.appendChild(titleDiv);
    notification.appendChild(infoDiv);
    notification.appendChild(tipDiv);
    
    document.body.appendChild(notification);
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }
  updateStats();
  updateFreeUserBanner();
  
  // Weekly Statistics
  function updateWeeklyStats() {
    chrome.storage.local.get({
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
      
      const iconDiv = document.createElement('div');
      iconDiv.className = 'pro-feature-icon';
      iconDiv.textContent = f.icon;
      
      const textDiv = document.createElement('div');
      textDiv.className = 'pro-feature-text';
      const h4 = document.createElement('h4');
      h4.textContent = f.title;
      const p = document.createElement('p');
      p.textContent = f.desc;
      textDiv.appendChild(h4);
      textDiv.appendChild(p);
      
      card.appendChild(iconDiv);
      card.appendChild(textDiv);
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
    thinkingBubble.innerHTML = '<span style="opacity: 0.5;">' + (I18N[currentLang].previewThinking || 'AI thinking...') + '</span>';
    previewChat.appendChild(thinkingBubble);
    previewChat.scrollTop = previewChat.scrollHeight;
    
    // Build conversation history and call API via background.js (reuses tryGenerate with full provider support)
    try {
      const historyMessages = [];
      const allBubbles = previewChat.querySelectorAll('.chat-bubble');
      allBubbles.forEach((bubble) => {
        if (bubble !== thinkingBubble) {
          historyMessages.push({
            role: bubble.classList.contains('user') ? 'user' : 'assistant',
            content: bubble.textContent
          });
        }
      });
      
      // Delegate to background.js which has full provider support (Anthropic, fallback, retry, etc.)
      const response = await Promise.race([
        chrome.runtime.sendMessage({
          action: 'previewChat',
          messages: historyMessages
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('请求超时，请重试')), 35000))
      ]);
      
      if (response.success && response.reply) {
        thinkingBubble.textContent = response.reply;
        thinkingBubble.style.opacity = '1';
      } else {
        const errorSpan = document.createElement('span');
        errorSpan.style.color = 'var(--error)';
        errorSpan.textContent = (I18N[currentLang].previewError || 'Error: ') + (response.error || '');
        thinkingBubble.textContent = '';
        thinkingBubble.appendChild(errorSpan);
      }
    } catch (error) {
      const errorSpan = document.createElement('span');
      errorSpan.style.color = 'var(--error)';
      errorSpan.textContent = (I18N[currentLang].previewError || 'Error: ') + error.message;
      thinkingBubble.textContent = '';
      thinkingBubble.appendChild(errorSpan);
    }
  });

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
      noResults.textContent = I18N[currentLang].noMatchingPersonas || 'No matching personas found';
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
      nameInput.placeholder = I18N[currentLang].personaNamePlaceholder || 'Persona Name';
      nameInput.value = persona.name;
      nameInput.onchange = (e) => { personas[index].name = e.target.value; };

      // Status badge
      const status = document.createElement('div');
      status.className = 'persona-status' + (persona.id === activePersonaId ? ' active' : '');
      status.innerHTML = '<span class="persona-status-dot"></span><span>' +
        (persona.id === activePersonaId
          ? (I18N[currentLang].statusActive || 'Active')
          : (I18N[currentLang].statusInactive || 'Inactive')) +
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
      editBtn.title = I18N[currentLang].editPersona || 'Edit Persona';
      editBtn.onclick = () => {
        const promptInput = card.querySelector('.persona-prompt-input');
        if (promptInput) {
          promptInput.classList.remove('persona-prompt-collapsed');
          promptInput.focus();
        }
      };

      // Delete button
      const delBtn = document.createElement('button');
      delBtn.className = 'persona-action-btn delete';
      delBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
      delBtn.title = I18N[currentLang].deletePersona || 'Delete Persona';
      delBtn.onclick = () => {
        if (confirm(I18N[currentLang].confirmDeletePersona || 'Delete this persona?')) {
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

      // Click header to toggle prompt collapse for non-active personas
      header.style.cursor = 'pointer';
      header.addEventListener('click', () => {
        const prompt = card.querySelector('.persona-prompt-input');
        if (prompt) {
          prompt.classList.toggle('persona-prompt-collapsed');
        }
      });

      // Prompt textarea
      const promptInput = document.createElement('textarea');
      promptInput.className = 'persona-prompt-input';
      promptInput.placeholder = I18N[currentLang].personaPromptPlaceholder || 'System Prompt...';
      promptInput.value = persona.prompt;
      promptInput.onchange = (e) => { personas[index].prompt = e.target.value; };
      // Collapse prompt for non-active personas
      const isActive = persona.id === activePersonaId;
      if (!isActive) {
        promptInput.classList.add('persona-prompt-collapsed');
      }

      // Toggle button
      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'persona-toggle-btn';
      toggleBtn.textContent = persona.id === activePersonaId
        ? (I18N[currentLang].toggleActive || '✓ Active')
        : (I18N[currentLang].toggleSetAsActive || 'Set as Active');
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
    activePersonaId = newId; // Always auto-activate new persona
    renderPersonas();
    // Focus on name input after render
    setTimeout(() => {
      const cards = personaList.querySelectorAll('.persona-card');
      cards.forEach(c => {
        const nameInput = c.querySelector('.persona-name-input');
        if (nameInput && !nameInput.value) nameInput.focus();
      });
    }, 50);
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
      
      // Build SVG icon safely (static trusted SVG markup)
      const svgWrapper = document.createElement('span');
      svgWrapper.innerHTML = `
        <svg class="recent-tag-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      `;
      
      // Use textContent for user-controlled persona name to prevent XSS
      const nameSpan = document.createElement('span');
      nameSpan.textContent = persona.name || (I18N[currentLang].personaNamePlaceholder || 'Persona Name');
      
      tag.appendChild(svgWrapper);
      tag.appendChild(nameSpan);
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

    showToast((I18N[currentLang].templateAdded || 'Template added: {name}').replace('{name}', newPersona.name));
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

    // Filter FAQ data based on search and category, preserving original indices
    const filteredFaq = [];
    faqData.forEach((item, index) => {
      // Category filter
      if (faqCategoryQuery !== 'all' && item.category !== faqCategoryQuery) return;
      // Search filter
      if (faqSearchQuery) {
        const query = faqSearchQuery.toLowerCase();
        const qMatch = item.q.toLowerCase().includes(query);
        const aMatch = item.a.toLowerCase().includes(query);
        if (!qMatch && !aMatch) return;
      }
      filteredFaq.push({ item, originalIndex: index });
    });

    if (filteredFaq.length === 0 && faqData.length > 0) {
      // Show no results message
      const noResults = document.createElement('div');
      noResults.className = 'faq-no-results';
      noResults.style.cssText = 'padding: 24px; text-align: center; color: var(--text-tertiary); font-size: 14px;';
      noResults.textContent = I18N[currentLang].noMatchingFaq || 'No matching Q&A found';
      faqList.appendChild(noResults);
      updateBatchToolbar();
      return;
    }

    // Render filtered FAQ items using preserved original indices
    filteredFaq.forEach(({ item, originalIndex: index }) => {
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

      // Category selector
      const cats = getFaqCategories();
      const catSelect = document.createElement('select');
      catSelect.className = 'faq-item-input';
      catSelect.style.cssText = 'width: auto; min-width: 100px; flex: 0;';
      Object.entries(cats).forEach(([key, info]) => {
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = info.label;
        if (key === (item.category || 'other')) opt.selected = true;
        catSelect.appendChild(opt);
      });
      catSelect.onchange = (e) => {
        faqData[index].category = e.target.value;
      };

      // Delete button
      const delBtn = document.createElement('button');
      delBtn.className = 'item-delete';
      delBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
      delBtn.onclick = () => {
        if (confirm(I18N[currentLang].confirmDeleteFaq || 'Delete this Q&A?')) {
          faqData.splice(index, 1);
          renderFaq();
        }
      };

      headerRow.appendChild(catSelect);
      headerRow.appendChild(delBtn);
      div.appendChild(headerRow);

      // Question input
      const qInput = document.createElement('input');
      qInput.className = 'faq-item-input question';
      qInput.placeholder = I18N[currentLang].questionLabel || 'Question';
      qInput.value = item.q;
      qInput.style.marginBottom = '8px';
      qInput.onchange = (e) => { faqData[index].q = e.target.value; };

      // Answer textarea
      const aInput = document.createElement('textarea');
      aInput.className = 'faq-item-input';
      aInput.placeholder = I18N[currentLang].answerLabel || 'Answer';
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
    batchCount.textContent = (I18N[currentLang].batchCountPrefix || '') + count + (I18N[currentLang].batchCountSuffix || ' selected');
    
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
      if (confirm((I18N[currentLang].confirmBatchDelete || 'Delete {n} items?').replace('{n}', count))) {
        
        // Remove selected items (sort indices in descending order to avoid index shifting)
        const sortedIndices = Array.from(selectedFaqIndices).sort((a, b) => b - a);
        sortedIndices.forEach(index => {
          faqData.splice(index, 1);
        });
        
        selectedFaqIndices.clear();
        renderFaq();
        updateBatchToolbar();
        showToast((I18N[currentLang].deletedCount || 'Deleted {n}').replace('{n}', count));
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
      showToast((I18N[currentLang].categoryUpdated || 'Updated {n}').replace('{n}', selectedFaqIndices.size));
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
        
        // Keyword-based categorization (fixed for Chinese characters)
        let predictedCategory = 'other';
        
        // Price-related keywords
        if (/price|cost|payment|pay|cheap|expensive|discount|refund|currency|美元|价格|费用|付款|支付|便宜|贵|折扣|退款|钱/i.test(text)) {
          predictedCategory = 'price';
        }
        // Product-related keywords
        else if (/product|item|feature|specification|size|color|material|quality|warranty|产品|商品|物品|功能|规格|尺寸|颜色|材质|质量|保修|型号/i.test(text)) {
          predictedCategory = 'product';
        }
        // Service-related keywords
        else if (/service|support|help|return|exchange|shipping|delivery|track|warranty|repair|服务|支持|帮助|退货|换货|发货|物流|跟踪|维修|售后/i.test(text)) {
          predictedCategory = 'service';
        }
        
        // Update if different and not manually set
        if (item.category !== predictedCategory) {
          item.category = predictedCategory;
          changedCount++;
        }
      });
      
      renderFaq();
      showToast((I18N[currentLang].smartCategorizeDone || 'Updated {n}').replace('{n}', changedCount));
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
            showToast((I18N[currentLang].importSuccess || 'Imported {n}').replace('{n}', validItems.length));
          } else {
            showToast(I18N[currentLang].importNoValid || 'No valid Q&A items found', true);
          }
        } else {
          showToast(I18N[currentLang].importInvalidFormat || 'Invalid file format', true);
        }
      } catch (err) {
        showToast(I18N[currentLang].importParseFail || 'Failed to parse JSON', true);
      }
    };
    reader.readAsText(file);
    faqFileInput.value = '';
  });

  exportFaqBtn.addEventListener('click', () => {
    const validFaq = faqData.filter(f => f.q.trim() && f.a.trim());
    if (validFaq.length === 0) {
      showToast(I18N[currentLang].exportNone || 'No Q&A items to export', true);
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
    showToast((I18N[currentLang].exportSuccess || 'Exported {n}').replace('{n}', validFaq.length));
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
    document.title = I18N[currentLang].pageTitle || 'ChatGenius AI';
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (I18N[currentLang][key]) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = I18N[currentLang][key];
        } else if (key === 'instructionsContent' || key === 'helpContent') {
          el.innerHTML = I18N[currentLang][key];
        } else if (key !== 'proFeatures') {
          el.textContent = I18N[currentLang][key];
        }
      }
    });
    renderPersonas();
    renderFaq();
    renderProFeatures();

    // Update upgrade modal & banner i18n
    const L = I18N[currentLang];
    const setText = (id, val) => { const el = document.getElementById(id); if (el && val) el.textContent = val; };
    setText('upgradeModalTitle', L.upgradeModalTitle);
    setText('upgradeOptCodeTitle', L.upgradeOptCodeTitle);
    setText('upgradeOptCodeDesc', L.upgradeOptCodeDesc);
    setText('upgradeOptBuyTitle', L.upgradeOptBuyTitle);
    setText('upgradeOptBuyDesc', L.upgradeOptBuyDesc);
    setText('modalActivateBtn', L.modalActivateBtn);
    setText('upgradeModalFooter', L.modalFooter);
    setText('freeBannerUpgradeBtn', L.freeBannerBtn);
    const modalInput = document.getElementById('modalActivationInput');
    if (modalInput && L.modalActivationPlaceholder) modalInput.placeholder = L.modalActivationPlaceholder;
    updateFreeUserBanner();
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
    updateThemePreviewMock(e.target.value);
  });

  // Theme live preview mock - shows how button looks in each theme
  function updateThemePreviewMock(theme) {
    const mock = document.getElementById('themePreviewMock');
    if (!mock) return;
    const themes = {
      gradient: { bg: 'linear-gradient(135deg, rgba(102,126,234,1), rgba(118,75,162,1))', color: '#fff', border: 'none', shadow: '0 4px 16px rgba(102,126,234,0.4)' },
      minimal: { bg: 'rgba(255,255,255,0.95)', color: '#1d1d1f', border: '1px solid rgba(0,0,0,0.08)', shadow: '0 2px 8px rgba(0,0,0,0.06)' },
      neon: { bg: 'rgba(0,0,0,0.9)', color: '#00ffcc', border: '1px solid rgba(0,255,204,0.5)', shadow: '0 0 12px rgba(0,255,204,0.3)' },
      glass: { bg: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', shadow: '0 4px 24px rgba(0,0,0,0.15)', blur: true }
    };
    const t = themes[theme] || themes.gradient;
    const allThemes = Object.entries(themes);
    mock.innerHTML = '';
    allThemes.forEach(([key, val]) => {
      const btn = document.createElement('div');
      btn.className = 'theme-mock-btn';
      btn.style.background = val.bg;
      btn.style.color = val.color;
      btn.style.border = val.border;
      btn.style.boxShadow = val.shadow;
      if (val.blur) btn.style.backdropFilter = 'blur(12px)';
      if (key === theme) {
        btn.style.outline = '2px solid #667eea';
        btn.style.outlineOffset = '2px';
      }
      btn.innerHTML = '<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>AI';
      mock.appendChild(btn);
    });
  }
  // Initial render
  updateThemePreviewMock(btnThemeSelect.value || 'gradient');

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

  // Weekly Stats Toggle
  const weeklyStatsToggle = document.getElementById('weeklyStatsToggle');
  const weeklyStatsContent = document.getElementById('weeklyStatsContent');
  if (weeklyStatsToggle && weeklyStatsContent) {
    weeklyStatsToggle.addEventListener('click', () => {
      weeklyStatsContent.classList.toggle('show');
      weeklyStatsToggle.classList.toggle('expanded');
    });
  }

  const upgradeBtn = document.getElementById('upgradeBtn');
  upgradeBtn.addEventListener('click', () => {
    openUpgradeModal();
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

  const proBtn = document.querySelector('.pro-btn');
  if (proBtn) {
    proBtn.addEventListener('click', () => {
      openUpgradeModal();
    });
  }
  
  // ================================
  // Activation Code Handler
  // ================================
  const activationCodeInput = document.getElementById('activationCodeInput');
  const activateBtn = document.getElementById('activateBtn');
  const activationError = document.getElementById('activationError');
  const activationSuccess = document.getElementById('activationSuccess');
  const licenseTypeDisplay = document.getElementById('licenseType');
  
  if (activateBtn && activationCodeInput) {
    activateBtn.addEventListener('click', async () => {
      const code = activationCodeInput.value.trim();
      
      if (!code) {
        activationError.textContent = I18N[currentLang].activateErrorEmpty || 'Please enter activation code';
        return;
      }
      
      activateBtn.disabled = true;
      activateBtn.innerHTML = `
        <svg class="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" stroke-dasharray="60" stroke-dashoffset="40"></circle>
        </svg>
        <span>${I18N[currentLang].activateVerifying || 'Verifying...'}</span>
      `;
      activationError.textContent = '';
      
      try {
        // Server-side activation: validate + consume atomically on server
        const normalizedCode = code.toUpperCase();
        // SYNC: API_BASE_URL must match background.js
        const API_BASE = I18N.API_BASE_URL;
        
        const response = await fetch(`${API_BASE}/api/license/activate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: normalizedCode })
        });
        
        const result = await response.json();
        
        if (result.valid && result.type) {
          const licenseType = result.type;
          
          // Save license to chrome.storage.sync (server already consumed the code)
          await chrome.storage.sync.set({
            licenseCode: normalizedCode,
            licenseType: licenseType,
            activatedAt: result.activatedAt || new Date().toISOString()
          });
          
          // Show success message
          activationSuccess.style.display = 'flex';
          const typeNames = {
            'lifetime': I18N[currentLang].statProLifetime || 'Pro Lifetime',
            'year': I18N[currentLang].statProYear || 'Pro Year',
            'free': I18N[currentLang].statFree || 'Free'
          };
          licenseTypeDisplay.textContent = typeNames[licenseType] || licenseType;
          
          activationCodeInput.value = '';
          activationError.textContent = '';
          
          // Update stats display
          updateStats();
          
          showToast((I18N[currentLang].activateSuccessPrefix || 'Activated! ') + (typeNames[licenseType] || licenseType));
        } else {
          activationError.textContent = result.error || (I18N[currentLang].activateErrorInvalid || 'Invalid code');
        }
      } catch (error) {
        console.error('Activation error:', error);
        activationError.textContent = I18N[currentLang].activateFail || 'Activation failed';
      } finally {
        activateBtn.disabled = false;
        activateBtn.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <span>${I18N[currentLang].activateLabel || 'Activate'}</span>
        `;
      }
    });
    
    // Allow Enter key to activate
    activationCodeInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        activateBtn.click();
      }
    });
  }
  
  // Check and display current license on page load
  chrome.storage.sync.get(['licenseCode', 'licenseType', 'activatedAt'], (data) => {
    if (data.licenseCode && data.licenseType) {
      activationSuccess.style.display = 'flex';
      const typeNames = {
        'lifetime': I18N[currentLang].statProLifetime || 'Pro Lifetime',
        'year': I18N[currentLang].statProYear || 'Pro Year',
        'free': I18N[currentLang].statFree || 'Free'
      };
      licenseTypeDisplay.textContent = typeNames[data.licenseType];
    }
  });

  // ================================
  // Free User Banner
  // ================================
  function updateFreeUserBanner() {
    const banner = document.getElementById('freeUserBanner');
    const bannerTitle = document.getElementById('freeBannerTitle');
    const bannerDesc = document.getElementById('freeBannerDesc');
    if (!banner) return;

    chrome.storage.sync.get(['licenseType'], (syncData) => {
      const licenseType = syncData.licenseType || 'free';
      if (licenseType !== 'free') {
        banner.style.display = 'none';
        return;
      }
      banner.style.display = 'flex';

      chrome.storage.local.get(['dailyReplyCount', 'lastResetDate'], (usageData) => {
        const today = new Date().toISOString().split('T')[0];
        const effectiveCount = usageData.lastResetDate === today ? (usageData.dailyReplyCount || 0) : 0;
        const lang = currentLang;
        bannerTitle.textContent = I18N[lang].freeBannerTitle || '当前：免费版';
        bannerDesc.textContent = (I18N[lang].freeBannerDesc || '今日已用 {used}/{limit} 次')
          .replace('{used}', effectiveCount)
          .replace('{limit}', DAILY_LIMIT);
      });
    });
  }

  const freeBannerUpgradeBtn = document.getElementById('freeBannerUpgradeBtn');
  if (freeBannerUpgradeBtn) {
    freeBannerUpgradeBtn.addEventListener('click', () => {
      openUpgradeModal();
    });
  }

  // ================================
  // Upgrade Modal
  // ================================
  const upgradeModal = document.getElementById('upgradeModal');
  const closeUpgradeModal = document.getElementById('closeUpgradeModal');
  const upgradeStepChoose = document.getElementById('upgradeStepChoose');
  const upgradeStepCode = document.getElementById('upgradeStepCode');
  const upgradeOptionCode = document.getElementById('upgradeOptionCode');
  const upgradeOptionBuy = document.getElementById('upgradeOptionBuy');
  const modalActivationInput = document.getElementById('modalActivationInput');
  const modalActivationError = document.getElementById('modalActivationError');
  const modalBackBtn = document.getElementById('modalBackBtn');
  const modalActivateBtn = document.getElementById('modalActivateBtn');
  const upgradeSuccessMsg = document.getElementById('upgradeSuccessMsg');
  const upgradeSuccessText = document.getElementById('upgradeSuccessText');

  function openUpgradeModal() {
    if (!upgradeModal) return;
    // Reset to step 1
    upgradeStepChoose.style.display = 'block';
    upgradeStepCode.style.display = 'none';
    upgradeSuccessMsg.classList.remove('show');
    if (modalActivationInput) modalActivationInput.value = '';
    if (modalActivationError) modalActivationError.textContent = '';
    upgradeModal.classList.add('show');
  }

  function closeUpgradeModalFn() {
    if (upgradeModal) upgradeModal.classList.remove('show');
  }

  if (closeUpgradeModal) {
    closeUpgradeModal.addEventListener('click', closeUpgradeModalFn);
  }
  if (upgradeModal) {
    upgradeModal.addEventListener('click', (e) => {
      if (e.target === upgradeModal) closeUpgradeModalFn();
    });
  }

  if (upgradeOptionCode) {
    upgradeOptionCode.addEventListener('click', () => {
      upgradeStepChoose.style.display = 'none';
      upgradeStepCode.style.display = 'block';
      upgradeSuccessMsg.classList.remove('show');
      if (modalActivationInput) modalActivationInput.focus();
    });
  }

  if (upgradeOptionBuy) {
    upgradeOptionBuy.addEventListener('click', () => {
      chrome.tabs.create({ url: UPGRADE_URL });
      closeUpgradeModalFn();
    });
  }

  if (modalBackBtn) {
    modalBackBtn.addEventListener('click', () => {
      upgradeStepCode.style.display = 'none';
      upgradeStepChoose.style.display = 'block';
      if (modalActivationError) modalActivationError.textContent = '';
    });
  }

  if (modalActivateBtn) {
    modalActivateBtn.addEventListener('click', async () => {
      const code = modalActivationInput.value.trim();
      if (!code) {
        modalActivationError.textContent = I18N[currentLang].activateErrorEmpty || '请输入激活码';
        return;
      }

      modalActivateBtn.disabled = true;
      modalActivateBtn.textContent = I18N[currentLang].activateVerifying || '验证中...';
      modalActivationError.textContent = '';

      try {
        const normalizedCode = code.toUpperCase();
        const API_BASE = I18N.API_BASE_URL;
        const response = await fetch(`${API_BASE}/api/license/activate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: normalizedCode })
        });
        const result = await response.json();

        if (result.valid && result.type) {
          const licenseType = result.type;
          await chrome.storage.sync.set({
            licenseCode: normalizedCode,
            licenseType: licenseType,
            activatedAt: result.activatedAt || new Date().toISOString()
          });

          // Show success
          upgradeStepCode.style.display = 'none';
          upgradeStepChoose.style.display = 'block';
          const typeNames = {
            'lifetime': I18N[currentLang].statProLifetime || 'Pro 永久版',
            'year': I18N[currentLang].statProYear || 'Pro 年付版'
          };
          upgradeSuccessText.textContent = (I18N[currentLang].activateSuccessPrefix || '激活成功！已升级到 ') + (typeNames[licenseType] || licenseType);
          upgradeSuccessMsg.classList.add('show');

          // Refresh page state
          updateStats();
          updateFreeUserBanner();

          // Close modal after 2s
          setTimeout(() => {
            closeUpgradeModalFn();
            upgradeSuccessMsg.classList.remove('show');
          }, 2000);
        } else {
          modalActivationError.textContent = result.error || (I18N[currentLang].activateErrorInvalid || '激活码无效');
        }
      } catch (error) {
        console.error('Modal activation error:', error);
        modalActivationError.textContent = I18N[currentLang].activateFail || '激活失败，请检查网络连接';
      } finally {
        modalActivateBtn.disabled = false;
        modalActivateBtn.textContent = I18N[currentLang].modalActivateBtn || I18N[currentLang].activateBtn || '激活';
      }
    });

    // Enter key to activate
    if (modalActivationInput) {
      modalActivationInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') modalActivateBtn.click();
      });
    }
  }
});