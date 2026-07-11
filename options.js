// options.js - ChatGenius AI Settings Page (Refactored)

// SYNC: Backend API base URL - must match across all files (background.js, options.js)
const API_BASE_URL = 'https://chat.sopie.cc';

// SYNC: Daily usage limit for free tier - must match across all files
const DAILY_LIMIT = 50;

// Upgrade URL — 指向落地页定价区域
const UPGRADE_URL = 'https://chat.sopie.cc/#pricing';

// 注意：LICENSE_HMAC_SECRET 已移除 — 客户端密钥本就公开，HMAC 签名无安全价值
// 防重放改由服务端 timestamp 校验（5分钟窗口）保障

// Chrome API compatibility layer for standalone preview
if (typeof chrome === 'undefined' || !chrome.storage) {
  const _mockStorage = {};
  const _mockGet = (storage) => (keys, cb) => {
    if (typeof keys === 'object' && !Array.isArray(keys)) {
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
      sync: { get: _mockGet('sync'), set: _mockSet('sync'), remove: _mockRemove('sync') },
      local: { get: _mockGet('local'), set: _mockSet('local'), remove: _mockRemove('local') }
    },
    runtime: {
      sendMessage: (msg, cb) => {
        const p = Promise.resolve({ success: false, error: 'Preview not available outside extension' });
        if (typeof cb === 'function') p.then(cb);
        return p;
      },
      onMessage: { addListener: () => {} }
    },
    i18n: { getMessage: (key) => key, getUILanguage: () => 'en' }
  };
}

// ================================
// I18N
// ================================
const I18N = {
  en: {
    title: 'ChatGenius AI Settings',
    pageTitle: 'ChatGenius AI - Settings',
    subtitle: 'Manage your AI personas, knowledge base and preferences',
    tabPersonas: 'AI Personas',
    tabApi: 'LLM API',
    tabKnowledge: 'Knowledge Base',
    tabSettings: 'Settings',
    tabAccount: 'Account',
    personaSettings: 'Custom Personas',
    personaHelp: 'Create multiple AI personas. Click anywhere to expand prompt.',
    addPersona: '+ Add Persona',
    templateLibrary: 'Template Library',
    templateHelp: 'Select a preset template to quickly create a new persona.',
    livePreview: 'Live Preview',
    previewHelp: 'Test your active persona in real-time.',
    previewPlaceholder: 'Type a test message (Markdown supported)...',
    sendBtn: 'Send',
    previewThinking: 'AI thinking...',
    previewError: 'Error: ',
    faq: 'Knowledge Base / FAQ',
    faqHelp: 'Add common Q&A. AI will naturally weave this info into replies.',
    faqSearchPlaceholder: 'Search Q&A...',
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
    addFaq: '+ Add Q&A',
    importBtn: 'Import',
    exportBtn: 'Export',
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
    uiSettings: 'UI & Interaction',
    genMode: 'Generation Mode',
    genModeLabel: 'Reply Generation Method',
    genModeManual: 'Manual (click floating icon)',
    genModeAuto: 'Auto (auto-generate on unreplied messages)',
    genModeHint: 'Auto: auto-generate reply and fill input box when unreplied message detected (will not auto-send); Manual: click floating icon to generate.',
    shortcut: 'Shortcut Key',
    shortcutHint: 'Alt+2 opens quick menu · Ctrl+Enter inserts reply · Ctrl+R regenerates',
    btnTheme: 'Floating Button Theme',
    themeGradient: 'Brand Indigo',
    themeMinimal: 'Minimalist',
    themeNeon: 'Cyber Neon',
    themeGlass: 'Glassmorphism',
    themeAurora: 'Aurora',
    themeSunset: 'Sunset',
    themeOcean: 'Ocean',
    themeCarbon: 'Carbon',
    apiConfig: 'API Configuration',
    apiConfigDesc: 'Configure AI provider and API key.',
    apiProvider: 'API Provider',
    provider: 'Provider',
    apiKey: 'API Key',
    testConnection: 'Test Connection',
    saveConfig: 'Save Config',
    apiConnected: 'Connected',
    apiDisconnected: 'Not connected',
    apiTesting: 'Testing...',
    apiTestSuccess: 'Connection successful!',
    apiTestFail: 'Connection failed: ',
    licenseStatus: 'License Status',
    licenseDesc: 'Currently using free version, limited to 20 replies per day. Upgrade to Pro for unlimited replies.',
    upgradeBtn: 'Upgrade to Pro',
    activatePlaceholder: 'Enter activation code (e.g. PRO-XXXX-XXXX)',
    activateLabel: 'Activate',
    activateVerifying: 'Verifying...',
    activateSuccessPrefix: 'Activated! Upgraded to ',
    activateErrorEmpty: 'Please enter activation code',
    activateErrorInvalid: 'Invalid code. Please check and try again',
    activateFail: 'Activation failed. Please check your network',
    deviceManagement: 'Device Management',
    deviceMgmtDesc: 'View devices bound to your activation code. You can unbind old devices to free up slots. Max 2 devices, 1 rebind per month.',
    deviceSlots: 'Slots Used',
    deviceRebindRemaining: 'Rebinds Left',
    refresh: 'Refresh',
    deviceListEmpty: 'Activate to view device list',
    dataBackup: 'Data Backup',
    dataBackupDesc: 'Export or import all settings (personas, FAQ, preferences, API config).',
    exportAllSettings: 'Export All Settings',
    importSettings: 'Import Settings',
    statReplies: 'Total Replies:',
    statSuccess: 'Success Rate:',
    statQuota: 'Today Quota:',
    saved: 'Saved',
    saving: 'Saving...',
    unsaved: 'Unsaved',
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
    saveFailed: 'Save failed, please retry',
    templateAdded: 'Template added: {name}',
    personaNamePlaceholder: 'Persona Name',
    statusActive: 'Active',
    statusInactive: 'Inactive',
    statusDefault: 'Default',
    toggleActive: 'Active',
    toggleSetAsActive: 'Set as Active',
    questionLabel: 'Question',
    answerLabel: 'Answer',
    upgradeModalTitle: 'Upgrade to ChatGenius Pro',
    upgradeOptCodeTitle: 'I have an activation code',
    upgradeOptBuyTitle: 'Purchase Online',
    close: 'Close',
    cancel: 'Cancel',
    confirm: 'Confirm',
    statProLifetime: 'Pro Lifetime',
    statProYear: 'Pro Year',
    statFree: 'Free',
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
    undoDelete: 'Undo',
    deletedFaq: 'Deleted 1 Q&A item',
    deletedPersona: 'Deleted "{name}"',
    importSettingsSuccess: 'Settings imported successfully!',
    importSettingsFail: 'Failed to import settings',
    exportSettingsSuccess: 'Settings exported!',
    exportSettingsNone: 'No settings to export',
    personaPromptPlaceholder: 'System Prompt\n\nExample: You are a professional customer service representative...',
    freeTierQuota: 'Today remaining {n} replies',
    freeTierUpgrade: 'Upgrade Pro',
    importFileTooLarge: 'File too large (max 1MB)',
    importInvalidData: 'Invalid data format',
    apiGuideText: 'Configure your API to enable AI replies',
    apiGuideBtn: 'Configure Now',
    emptyPersonas: 'No custom personas yet',
    emptyPersonasCta1: 'Create from Template',
    emptyPersonasCta2: 'Add Manually',
    emptyFaq: 'No knowledge base entries',
    emptyFaqCta: 'Add First Entry'
  },
  zh: {
    title: 'ChatGenius AI 设置',
    pageTitle: 'ChatGenius AI - 设置',
    subtitle: '管理你的 AI 角色、知识库和偏好',
    tabPersonas: 'AI 角色',
    tabApi: '大模型 API',
    tabKnowledge: '知识库',
    tabSettings: '设置',
    tabAccount: '账户',
    personaSettings: '自定义角色',
    personaHelp: '创建多个 AI 角色，点击任意位置展开 prompt。',
    addPersona: '+ 添加角色',
    templateLibrary: '模板库',
    templateHelp: '选择预设模板快速创建新角色。',
    livePreview: '实时预览',
    previewHelp: '测试当前激活角色的回复效果。',
    previewPlaceholder: '输入测试消息（支持 Markdown）...',
    sendBtn: '发送',
    previewThinking: 'AI 思考中...',
    previewError: '错误: ',
    faq: '知识库 / FAQ',
    faqHelp: '添加常见问答，AI 会自然融入这些信息。',
    faqSearchPlaceholder: '搜索问答...',
    allCategories: '全部分类',
    catProduct: '产品相关',
    catPrice: '价格咨询',
    catService: '售后服务',
    catOther: '其他',
    batchSelectAll: '全选',
    batchCountPrefix: '已选 ',
    batchCountSuffix: ' 条',
    batchDelete: '删除',
    batchMoveTo: '移动到分类...',
    smartCategorize: '智能分类',
    addFaq: '+ 添加问答',
    importBtn: '导入',
    exportBtn: '导出',
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
    uiSettings: '界面与交互',
    genMode: '生成模式',
    genModeLabel: '回复生成方式',
    genModeManual: '手动生成（点击悬浮图标）',
    genModeAuto: '自动检索（检测到未回复消息自动生成）',
    genModeHint: '自动模式：检测到客户未回复消息时自动生成回复并填入输入框（不会自动发送）；手动模式：点击悬浮图标生成回复。',
    shortcut: '快捷键',
    shortcutHint: 'Alt+2 打开快捷菜单 · Ctrl+Enter 插入回复 · Ctrl+R 重新生成',
    btnTheme: '悬浮按钮主题',
    themeGradient: '品牌靛蓝',
    themeMinimal: '极简黑白',
    themeNeon: '赛博霓虹',
    themeGlass: '毛玻璃',
    themeAurora: '极光渐变',
    themeSunset: '日落暖橙',
    themeOcean: '海洋深蓝',
    themeCarbon: '碳纤维黑',
    apiConfig: 'API 配置',
    apiConfigDesc: '配置 AI 服务提供商和 API 密钥。',
    apiProvider: 'API 提供商',
    provider: '提供商',
    apiKey: 'API Key',
    testConnection: '测试连接',
    saveConfig: '保存配置',
    apiConnected: '已连接',
    apiDisconnected: '未连接',
    apiTesting: '测试中...',
    apiTestSuccess: '连接成功！',
    apiTestFail: '连接失败: ',
    licenseStatus: '许可证状态',
    licenseDesc: '当前使用免费版，每日限 20 次回复。升级到 Pro 版享受无限次回复和高级功能。',
    upgradeBtn: '升级至 Pro 版',
    activatePlaceholder: '输入激活码（例如：PRO-XXXX-XXXX）',
    activateLabel: '激活',
    activateVerifying: '验证中...',
    activateSuccessPrefix: '激活成功！已升级到 ',
    activateErrorEmpty: '请输入激活码',
    activateErrorInvalid: '激活码无效，请检查后重试',
    activateFail: '激活失败，请检查网络连接',
    deviceManagement: '设备管理',
    deviceMgmtDesc: '查看当前激活码绑定的设备，可主动解绑旧设备以腾出名额。最多绑定 2 台设备，每月可换绑 1 次。',
    deviceSlots: '已用名额',
    deviceRebindRemaining: '本月剩余换绑',
    refresh: '刷新',
    deviceListEmpty: '激活后可查看设备列表',
    dataBackup: '数据备份',
    dataBackupDesc: '导出或导入全部设置（包括角色、FAQ、偏好和 API 配置）。',
    exportAllSettings: '导出全部设置',
    importSettings: '导入设置',
    statReplies: '累计回复:',
    statSuccess: '成功率:',
    statQuota: '今日配额:',
    saved: '已保存',
    saving: '保存中...',
    unsaved: '未保存',
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
    saveFailed: '保存失败，请重试',
    templateAdded: '已添加模板：{name}',
    personaNamePlaceholder: '角色名称',
    statusActive: '当前使用',
    statusInactive: '未激活',
    statusDefault: '默认',
    toggleActive: '当前激活',
    toggleSetAsActive: '切换为当前角色',
    questionLabel: '问题',
    answerLabel: '答案',
    upgradeModalTitle: '升级 ChatGenius Pro',
    upgradeOptCodeTitle: '我有激活码',
    upgradeOptBuyTitle: '在线购买',
    close: '关闭',
    statProLifetime: 'Pro 永久版',
    statProYear: 'Pro 年付版',
    statFree: '免费版',
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
    undoDelete: '撤销',
    deletedFaq: '已删除 1 条问答',
    deletedPersona: '已删除 "{name}"',
    importSettingsSuccess: '设置导入成功！',
    importSettingsFail: '导入设置失败',
    exportSettingsSuccess: '设置已导出！',
    exportSettingsNone: '没有可导出的设置',
    personaPromptPlaceholder: '系统提示词 (Prompt)\n\n例如：你是一个专业的客服代表，负责解答客户关于产品的疑问...',
    freeTierQuota: '今日剩余 {n} 次回复机会',
    freeTierUpgrade: '升级 Pro',
    importFileTooLarge: '文件过大（最大 1MB）',
    importInvalidData: '数据格式无效',
    apiGuideText: '建议先配置 API 以启用 AI 回复',
    apiGuideBtn: '去配置',
    emptyPersonas: '还没有自定义角色',
    emptyPersonasCta1: '从模板创建',
    emptyPersonasCta2: '手动添加',
    emptyFaq: '还没有知识库条目',
    emptyFaqCta: '添加第一条'
  }
};

// Utility: debounce
function debounce(fn, delay) {
  let timer = null;
  return function(...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Persona Templates
const PERSONA_TEMPLATES = [
  { id: 'sales', icon: '💼', nameKey: 'templateSales', descKey: 'templateSalesDesc', prompt: '你是[公司名称]的销售经理。你的目标是了解客户需求，推荐合适的产品，并促成交易。\n\n回复时请：\n1. 礼貌热情，展现专业形象\n2. 主动询问客户的具体需求（如产品类型、数量、预算等）\n3. 根据需求推荐最适合的产品\n4. 在适当时机引导客户下单或索取联系方式\n\n语气：专业但友好，让客户感受到诚意。' },
  { id: 'support', icon: '🎧', nameKey: 'templateSupport', descKey: 'templateSupportDesc', prompt: '你是[公司名称]的客服代表。你的职责是解答客户疑问，处理投诉，提供满意的服务体验。\n\n回复时请：\n1. 保持耐心和同理心\n2. 清晰解答客户的问题\n3. 主动提供解决方案\n4. 必要时引导客户联系人工客服\n\n语气：温暖友好，让客户感到被重视。' },
  { id: 'tech', icon: '🔧', nameKey: 'templateTech', descKey: 'templateTechDesc', prompt: '你是[公司名称]的技术支持专家。你负责解决客户在使用产品过程中遇到的技术问题。\n\n回复时请：\n1. 准确理解客户描述的问题\n2. 提供清晰的解决步骤\n3. 必要时询问更多细节（如错误信息、设备型号等）\n4. 复杂问题建议提交工单\n\n语气：专业严谨，但通俗易懂。' },
  { id: 'product', icon: '', nameKey: 'templateProduct', descKey: 'templateProductDesc', prompt: '你是[公司名称]的产品顾问。你对所有产品特性了如指掌，能为客户提供专业的产品建议。\n\n回复时请：\n1. 了解客户的使用场景和需求\n2. 对比不同产品的优劣\n3. 推荐最匹配的产品方案\n4. 解释推荐理由\n\n语气：专业且具有说服力。' },
  { id: 'success', icon: '⭐', nameKey: 'templateSuccess', descKey: 'templateSuccessDesc', prompt: '你是[公司名称]的客户成功经理。你的目标是帮助客户成功使用产品，提升满意度和留存率。\n\n回复时请：\n1. 了解客户当前的使用情况\n2. 主动提供使用建议和最佳实践\n3. 关注客户可能遇到的困难\n4. 引导客户充分利用产品功能\n\n语气：亲切关怀，展现长期服务的诚意。' }
];

// ================================
// Main
// ================================
document.addEventListener('DOMContentLoaded', () => {
  // ---- Theme Toggle ----
  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    try {
      localStorage.setItem('chatgenius_theme', newTheme);
    } catch (e) {
      // localStorage 不可用时忽略
    }
  }

  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  // 移动端 header 主题切换按钮
  const headerThemeToggle = document.getElementById('headerThemeToggle');
  if (headerThemeToggle) {
    headerThemeToggle.addEventListener('click', toggleTheme);
  }

  // ---- ⌘K / Ctrl+K 平台适配 ----
  const cmdKbd = document.getElementById('cmdKbd');
  if (cmdKbd) {
    const isMac = navigator.platform.includes('Mac');
    cmdKbd.textContent = isMac ? '⌘K' : 'Ctrl K';
  }

  // ---- Modal 焦点陷阱工具（建议 1 + 建议 7：ARIA dialog 语义 + 统一 class 驱动） ----
  let _previouslyFocused = null;

  function _trapKeydown(e) {
    if (e.key !== 'Tab') return;
    const modal = e.currentTarget;
    if (!modal.classList.contains('show')) return;
    const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function openModal(modal) {
    if (!modal) return;
    _previouslyFocused = document.activeElement;
    modal.classList.add('show');
    // 首次聚焦：优先聚焦交互元素
    const focusable = modal.querySelector('button, [href], input');
    if (focusable) setTimeout(() => focusable.focus(), 50);
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('show');
    if (_previouslyFocused && _previouslyFocused.focus) {
      _previouslyFocused.focus();
    }
    _previouslyFocused = null;
  }

  // 为所有 modal 和 cmd overlay 绑定焦点陷阱（仅绑定一次）
  document.querySelectorAll('.modal-overlay, .cmd-overlay').forEach(m => {
    m.addEventListener('keydown', _trapKeydown);
  });

  // ---- Command Palette（建议 15：结果渲染 + 键盘导航 + 执行） ----
  const cmdTrigger = document.getElementById('cmdTrigger');
  const cmdOverlay = document.getElementById('cmdOverlay');
  const cmdInput = document.getElementById('cmdInput');
  const cmdResults = document.getElementById('cmdResults');
  let _cmdActiveIndex = -1;
  let _cmdFiltered = [];

  function _getCmdItems() {
    const L = I18N[currentLang] || I18N.zh;
    return [
      { id: 'tab-personas', label: L.tabPersonas || 'AI 角色', hint: '切换到角色面板', icon: '👤', action: () => switchTab('personas') },
      { id: 'tab-api', label: L.tabApi || '大模型 API', hint: '切换到大模型 API 配置', icon: '⚡', action: () => switchTab('api') },
      { id: 'tab-knowledge', label: L.tabKnowledge || '知识库', hint: '切换到知识库', icon: '📚', action: () => switchTab('knowledge') },
      { id: 'tab-settings', label: L.tabSettings || '设置', hint: '切换到设置', icon: '⚙️', action: () => switchTab('settings') },
      { id: 'tab-account', label: L.tabAccount || '账户', hint: '切换到账户', icon: '💳', action: () => switchTab('account') },
      { id: 'toggle-theme', label: currentLang === 'zh' ? '切换主题' : 'Toggle Theme', hint: currentLang === 'zh' ? '明暗模式切换' : 'Light/Dark', icon: '🌓', action: () => toggleTheme() },
      { id: 'open-templates', label: L.templateLibrary || '模板库', hint: currentLang === 'zh' ? '打开角色模板' : 'Open persona templates', icon: '📋', action: () => { const m = document.getElementById('templateModal'); if (m) { if (typeof renderTemplateLibrary === 'function') renderTemplateLibrary(); openModal(m); } } },
      { id: 'export-settings', label: L.exportAllSettings || '导出全部设置', hint: currentLang === 'zh' ? '备份到文件' : 'Backup to file', icon: '💾', action: () => { const b = document.getElementById('exportAllSettingsBtn'); if (b) b.click(); } },
      { id: 'import-settings', label: L.importSettings || '导入设置', hint: currentLang === 'zh' ? '从文件恢复' : 'Restore from file', icon: '📥', action: () => { const b = document.getElementById('importAllSettingsBtn'); if (b) b.click(); } },
    ];
  }

  function _renderCmdResults(query) {
    if (!cmdResults) return;
    const items = _getCmdItems();
    const q = (query || '').trim().toLowerCase();
    _cmdFiltered = q ? items.filter(it => it.label.toLowerCase().includes(q) || it.hint.toLowerCase().includes(q) || it.id.includes(q)) : items;

    if (!_cmdFiltered.length) {
      cmdResults.innerHTML = '<div class="cmd-empty">' + escapeHtml(I18N[currentLang].noMatchingFaq || 'No results') + '</div>';
      _cmdActiveIndex = -1;
      return;
    }

    cmdResults.innerHTML = _cmdFiltered.map((it, i) => {
      return '<button class="cmd-item' + (i === 0 ? ' active' : '') + '" type="button" data-cmd-index="' + i + '">' +
        '<span class="cmd-item-icon">' + it.icon + '</span>' +
        '<span class="cmd-item-label">' + escapeHtml(it.label) + '</span>' +
        '<span class="cmd-item-hint">' + escapeHtml(it.hint) + '</span>' +
        '</button>';
    }).join('');
    _cmdActiveIndex = 0;

    // 绑定点击和 hover
    cmdResults.querySelectorAll('.cmd-item').forEach((el, i) => {
      el.addEventListener('click', () => _executeCmdItem(i));
      el.addEventListener('mouseenter', () => _setCmdActive(i));
    });
  }

  function _setCmdActive(index) {
    if (!cmdResults) return;
    const items = cmdResults.querySelectorAll('.cmd-item');
    if (!items.length) return;
    if (index < 0) index = items.length - 1;
    if (index >= items.length) index = 0;
    items.forEach((el, i) => el.classList.toggle('active', i === index));
    _cmdActiveIndex = index;
    // 滚动可见
    const active = items[index];
    if (active && active.scrollIntoView) active.scrollIntoView({ block: 'nearest' });
  }

  function _executeCmdItem(index) {
    if (!_cmdFiltered[index]) return;
    const item = _cmdFiltered[index];
    closeCmdPalette();
    try { item.action(); } catch (e) { console.error('Cmd action error:', e); }
  }

  function openCmdPalette() {
    if (!cmdOverlay) return;
    openModal(cmdOverlay);
    if (cmdInput) {
      cmdInput.value = '';
      setTimeout(() => cmdInput.focus(), 50);
    }
    _renderCmdResults('');
  }

  function closeCmdPalette() {
    closeModal(cmdOverlay);
  }

  if (cmdTrigger) {
    cmdTrigger.addEventListener('click', openCmdPalette);
  }

  if (cmdOverlay) {
    cmdOverlay.addEventListener('click', (e) => {
      if (e.target === cmdOverlay) closeCmdPalette();
    });
  }

  if (cmdInput) {
    cmdInput.addEventListener('input', () => _renderCmdResults(cmdInput.value));
    cmdInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { closeCmdPalette(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); _setCmdActive(_cmdActiveIndex + 1); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); _setCmdActive(_cmdActiveIndex - 1); return; }
      if (e.key === 'Enter') { e.preventDefault(); _executeCmdItem(_cmdActiveIndex); return; }
    });
  }

  document.addEventListener('keydown', (e) => {
    const isMac = navigator.platform.includes('Mac');
    const modKey = isMac ? e.metaKey : e.ctrlKey;
    if (modKey && e.key === 'k') {
      e.preventDefault();
      if (cmdOverlay && cmdOverlay.classList.contains('show')) {
        closeCmdPalette();
      } else {
        openCmdPalette();
      }
    }
  });

  // ---- State ----
  let currentLang = 'zh';
  let faqData = [];
  let personas = [];
  let activePersonaId = null;
  let faqSearchQuery = '';
  let faqCategoryQuery = 'all';
  let selectedFaqIndices = new Set();
  let deletedFaqUndo = null; // { items: [], timer }
  let deletedPersonaUndo = null; // { item, index, wasActive, timer }
  let modelsConfig = null; // Loaded from models-config.json

  // ---- XSS Protection ----
  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#39;');
  }

  // ---- Empty State Utility（统一空状态契约：克隆 template + 填充标题/描述） ----
  function renderEmptyState(container, title, desc) {
    const tpl = document.getElementById('emptyStateTpl');
    if (!tpl) return null;
    const clone = tpl.content.cloneNode(true);
    clone.querySelector('.empty-state-title').textContent = title || '';
    const descEl = clone.querySelector('.empty-state-desc');
    if (desc) {
      descEl.textContent = desc;
    } else {
      descEl.remove();
    }
    container.innerHTML = '';
    container.appendChild(clone);
    return container;
  }

  // 创建空状态元素（返回带 empty-state 类的 div，可直接 appendChild）
  function createEmptyState(title, desc) {
    const tpl = document.getElementById('emptyStateTpl');
    if (!tpl) {
      const fallback = document.createElement('div');
      fallback.className = 'empty-state';
      fallback.innerHTML = '<div class="empty-state-title">' + escapeHtml(title || '') + '</div>';
      return fallback;
    }
    const clone = tpl.content.cloneNode(true);
    const root = clone.querySelector('.empty-state');
    root.querySelector('.empty-state-title').textContent = title || '';
    const descEl = root.querySelector('.empty-state-desc');
    if (desc) {
      descEl.textContent = desc;
    } else {
      descEl.remove();
    }
    return root;
  }

  // ---- Auto-save ----
  let saveTimer = null;
  const SAVE_DELAY = 500;

  function scheduleSave() {
    updateSaveStatus('saving');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      doSave();
    }, SAVE_DELAY);
  }

  function doSave() {
    // Save all items including empty ones (new items being edited)
    const tone = document.getElementById('tone')?.value || 'auto';
    const replyLength = document.getElementById('replyLength')?.value || 'auto';
    const btnTheme = document.getElementById('btnTheme')?.value || 'gradient';
    const generationMode = document.getElementById('generationMode')?.value || 'auto';
    // 用户直接配置：URL + Key + 模型名（不再依赖预设服务商）
    const apiUrl = document.getElementById('apiUrlInput')?.value.trim() || '';
    const apiKey = document.getElementById('apiKey')?.value || '';
    const modelName = document.getElementById('modelNameInput')?.value.trim() || '';

    // API 配置已改为通过「保存配置」按钮独立保存，避免自动保存污染 connectionValid 状态
    // 此处仅做 local.set 以保持兼容（不修改 savedApiFingerprint，不触碰 connectionValid）
    chrome.storage.local.set({ apiProvider: 'custom' }, () => {
      if (chrome.runtime.lastError) {
        console.error('Local save failed:', chrome.runtime.lastError);
      }
    });

    // Other settings remain in sync storage
    chrome.storage.sync.set({
      personas: personas,
      activePersonaId,
      tone,
      replyLength,
      faqData: faqData,
      btnTheme,
      generationMode,
      lang: currentLang
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('Save failed:', chrome.runtime.lastError);
        showToast(I18N[currentLang].saveFailed || '保存失败，请重试', true);
        return;
      }
      updateSaveStatus('saved');
    });

    // 刷新 API 状态栏
    updateApiStatusBar();
  }

  function updateSaveStatus(status) {
    const statReplies = document.getElementById('statReplies');
    // We'll show save status in the footer
    const footer = document.querySelector('.footer-status-bar');
    if (!footer) return;
    let statusEl = document.getElementById('saveStatusEl');
    if (!statusEl) {
      statusEl = document.createElement('div');
      statusEl.id = 'saveStatusEl';
      statusEl.className = 'footer-status-item';
      footer.appendChild(statusEl);
    }
    const L = I18N[currentLang];
    if (status === 'saved') {
      statusEl.innerHTML = '<span style="color:var(--success);font-weight:600;">✓ ' + escapeHtml(L.saved || 'Saved') + '</span>';
    } else if (status === 'saving') {
      statusEl.innerHTML = '<span style="color:var(--text-tertiary);">' + escapeHtml(L.saving || 'Saving...') + '</span>';
    }
  }

  // ---- Tab Navigation ----
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  function switchTab(targetTab) {
    if (!targetTab) return;
    tabBtns.forEach(b => {
      const isActive = b.getAttribute('data-tab') === targetTab;
      b.classList.toggle('active', isActive);
      b.setAttribute('aria-current', isActive ? 'page' : 'false');
    });
    tabContents.forEach(content => {
      content.classList.toggle('active', content.id === 'tab-' + targetTab);
    });
    // 切换到账户 tab 时刷新设备列表
    if (targetTab === 'account' && typeof window.__refreshDevices === 'function') {
      setTimeout(() => { try { window.__refreshDevices(); } catch (e) {} }, 50);
    }
  }

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.getAttribute('data-tab'));
    });
  });

  // ---- details aria-expanded 同步（建议 6） ----
  document.querySelectorAll('details.panel').forEach(d => {
    const summary = d.querySelector('summary');
    if (!summary) return;
    summary.setAttribute('role', 'button');
    summary.setAttribute('aria-expanded', d.open ? 'true' : 'false');
    d.addEventListener('toggle', () => {
      summary.setAttribute('aria-expanded', d.open ? 'true' : 'false');
    });
  });

  // Switch to pending tab
  chrome.storage.local.get(['pendingOptionsTab'], (data) => {
    if (chrome.runtime.lastError) {
      console.error('Storage error:', chrome.runtime.lastError);
      return;
    }
    if (data.pendingOptionsTab) {
      chrome.storage.local.remove('pendingOptionsTab');
      const targetBtn = document.querySelector('.tab-btn[data-tab="' + data.pendingOptionsTab + '"]');
      if (targetBtn) targetBtn.click();
    }
  });

  // ---- Toast（建议 8：迁移 inline style 至 CSS 类，扩展签名支持 action 按钮） ----
  function showToast(msg, isError, actionLabel, actionCallback) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');
    if (!toast || !toastMsg) return;
    toastMsg.textContent = msg;
    toast.className = (isError ? 'error ' : '') + 'show';

    // 清理旧的 action 按钮和关闭按钮（每次重建，确保状态一致）
    let closeBtn = toast.querySelector('.toast-close');
    if (!closeBtn) {
      closeBtn = document.createElement('button');
      closeBtn.className = 'toast-close';
      closeBtn.type = 'button';
      closeBtn.setAttribute('aria-label', '关闭');
      closeBtn.textContent = '×';
      toast.appendChild(closeBtn);
    }
    closeBtn.onclick = () => {
      if (toast._toastTimer) {
        clearTimeout(toast._toastTimer);
        toast._toastTimer = null;
      }
      toast.className = toast.className.replace('show', '').trim();
    };

    // 移除旧的 action 按钮
    const oldAction = toast.querySelector('.toast-action');
    if (oldAction) oldAction.remove();

    // 如有 action，创建 action 按钮
    if (actionLabel && typeof actionCallback === 'function') {
      const action = document.createElement('button');
      action.className = 'toast-action';
      action.type = 'button';
      action.textContent = actionLabel;
      action.addEventListener('click', () => {
        try { actionCallback(); } catch (e) { console.error('Toast action error:', e); }
        if (toast._toastTimer) {
          clearTimeout(toast._toastTimer);
          toast._toastTimer = null;
        }
        toast.className = toast.className.replace('show', '').trim();
      });
      // action 插入在 closeBtn 之前
      toast.insertBefore(action, closeBtn);
    }

    // 错误类显示 5 秒，成功类显示 2.5 秒；有 action 时延长至 6 秒
    let duration = isError ? 5000 : 2500;
    if (actionLabel) duration = Math.max(duration, 6000);
    if (toast._toastTimer) clearTimeout(toast._toastTimer);
    toast._toastTimer = setTimeout(() => {
      toast.className = toast.className.replace('show', '').trim();
      toast._toastTimer = null;
    }, duration);

    // 鼠标悬停时暂停自动关闭
    toast.onmouseenter = () => {
      if (toast._toastTimer) {
        clearTimeout(toast._toastTimer);
        toast._toastTimer = null;
      }
    };
    toast.onmouseleave = () => {
      if (!toast.className.includes('show')) return;
      if (toast._toastTimer) clearTimeout(toast._toastTimer);
      toast._toastTimer = setTimeout(() => {
        toast.className = toast.className.replace('show', '').trim();
        toast._toastTimer = null;
      }, duration);
    };
  }

  function showConfirm(title, message) {
    return new Promise((resolve) => {
      const modal = document.getElementById('confirmModal');
      const titleEl = document.getElementById('confirmTitle');
      const messageEl = document.getElementById('confirmMessage');
      const okBtn = document.getElementById('confirmOkBtn');
      const cancelBtn = document.getElementById('confirmCancelBtn');

      if (!modal || !okBtn || !cancelBtn) {
        // 降级到原生 confirm
        resolve(confirm(message));
        return;
      }

      if (titleEl) titleEl.textContent = title;
      if (messageEl) messageEl.textContent = message;
      openModal(modal);

      const cleanup = (result) => {
        closeModal(modal);
        okBtn.removeEventListener('click', okHandler);
        cancelBtn.removeEventListener('click', cancelHandler);
        resolve(result);
      };

      const okHandler = () => cleanup(true);
      const cancelHandler = () => cleanup(false);

      okBtn.addEventListener('click', okHandler);
      cancelBtn.addEventListener('click', cancelHandler);
    });
  }

  // ---- Global Escape key to close modals（建议 7：统一 class 驱动，简化检测） ----
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const modals = document.querySelectorAll('.modal-overlay, .cmd-overlay');
    modals.forEach(modal => {
      if (!modal.classList.contains('show')) return;
      if (modal.id === 'confirmModal') {
        // Trigger cancel button so showConfirm resolves(false) correctly
        const cancelBtn = modal.querySelector('#confirmCancelBtn');
        if (cancelBtn) cancelBtn.click();
      } else {
        closeModal(modal);
      }
    });
  });

  // ---- I18n ----
  function applyI18n() {
    document.documentElement.lang = currentLang === 'zh' ? 'zh-CN' : 'en';
    document.title = I18N[currentLang].title || 'ChatGenius AI';
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (I18N[currentLang][key]) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = I18N[currentLang][key];
        } else {
          el.textContent = I18N[currentLang][key];
        }
      }
    });
  }

  // ---- Persona Rendering ----
  const personaList = document.getElementById('personaList');

  function renderPersonas() {
    if (!personaList) return;
    personaList.innerHTML = '';

    if (personas.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = '<div class="empty-state-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>' +
        '<div class="empty-state-title">' +
        escapeHtml(I18N[currentLang].emptyPersonas || 'No custom personas yet') + '</div>' +
        '<div class="empty-state-desc">' + escapeHtml(I18N[currentLang].personaHelp || 'Click "Add Persona" to create one.') + '</div>';
      const ctaRow = document.createElement('div');
      ctaRow.className = 'empty-state-cta';

      const cta1 = document.createElement('button');
      cta1.className = 'btn btn-primary';
      cta1.textContent = I18N[currentLang].emptyPersonasCta1 || 'Create from Template';
      cta1.addEventListener('click', () => {
        renderTemplateLibrary();
        if (templateModal) openModal(templateModal);
      });

      const cta2 = document.createElement('button');
      cta2.className = 'btn btn-secondary';
      cta2.textContent = I18N[currentLang].emptyPersonasCta2 || 'Add Manually';
      cta2.addEventListener('click', () => {
        if (addPersonaBtn) addPersonaBtn.click();
      });

      ctaRow.appendChild(cta1);
      ctaRow.appendChild(cta2);
      empty.appendChild(ctaRow);
      personaList.appendChild(empty);
      return;
    }

    personas.forEach((persona, index) => {
      const isActive = persona.id === activePersonaId;
      const card = document.createElement('div');
      card.className = 'persona-card' + (isActive ? ' active' : '');

      // Header
      const header = document.createElement('div');
      header.className = 'persona-card-header';

      // 头像：取名字首字母，无名字时用默认图标
      const avatar = document.createElement('div');
      avatar.className = 'persona-avatar';
      const firstChar = (persona.name || '').trim().charAt(0);
      if (firstChar) {
        avatar.textContent = firstChar;
      } else {
        avatar.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
      }

      const info = document.createElement('div');
      info.className = 'persona-info';

      const nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.className = 'persona-name-input';
      nameInput.placeholder = I18N[currentLang].personaNamePlaceholder || 'Persona Name';
      nameInput.value = persona.name;
      nameInput.addEventListener('input', (e) => {
        personas[index].name = e.target.value;
        // 实时更新头像首字母
        const ch = e.target.value.trim().charAt(0);
        if (ch) {
          avatar.textContent = ch;
        } else {
          avatar.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
        }
        scheduleSave();
      });
      nameInput.addEventListener('click', (e) => e.stopPropagation());
      nameInput.addEventListener('mousedown', (e) => e.stopPropagation());

      const badge = document.createElement('div');
      badge.className = 'persona-badge ' + (isActive ? 'default' : 'inactive');
      badge.innerHTML = '<span class="persona-badge-dot"></span>' +
        escapeHtml(isActive ? (I18N[currentLang].statusDefault || 'Default') : (I18N[currentLang].statusInactive || 'Inactive'));

      info.appendChild(nameInput);
      info.appendChild(badge);

      const actions = document.createElement('div');
      actions.className = 'persona-actions';

      const delBtn = document.createElement('button');
      delBtn.className = 'persona-action-btn danger';
      delBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>';
      delBtn.title = 'Delete';
      delBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const confirmed = await showConfirm(I18N[currentLang].confirmDeletePersona || '确认删除', I18N[currentLang].confirmDeletePersona || '确定要删除这个角色吗？');
        if (!confirmed) return;

        // Delete with undo
        const deletedPersona = personas.splice(index, 1)[0];
        const wasActive = activePersonaId === deletedPersona.id;
        if (wasActive) {
          activePersonaId = personas.length > 0 ? personas[0].id : null;
        }
        deletedPersonaUndo = { item: deletedPersona, index, wasActive, timer: null };
        renderPersonas();
        scheduleSave();

        // 使用 showToast action 集成 Undo（建议 8）
        showToast(
          (I18N[currentLang].deletedPersona || 'Deleted "{name}"').replace('{name}', deletedPersona.name || ''),
          false,
          I18N[currentLang].undoDelete || 'Undo',
          () => {
            if (!deletedPersonaUndo) return;
            personas.splice(deletedPersonaUndo.index, 0, deletedPersonaUndo.item);
            if (deletedPersonaUndo.wasActive) {
              activePersonaId = deletedPersonaUndo.item.id;
            }
            deletedPersonaUndo = null;
            renderPersonas();
            scheduleSave();
          }
        );
        // 设置 undo 过期计时器（与 toast 显示时长一致）
        if (deletedPersonaUndo) {
          deletedPersonaUndo.timer = setTimeout(() => {
            deletedPersonaUndo = null;
          }, 6000);
        }
      });

      actions.appendChild(delBtn);
      header.appendChild(avatar);
      header.appendChild(info);
      header.appendChild(actions);

      // Click card to toggle prompt
      card.addEventListener('click', () => {
        const promptInput = card.querySelector('.persona-prompt-input');
        if (promptInput) {
          promptInput.classList.toggle('persona-prompt-collapsed');
        }
      });

      // Prompt label + textarea
      const promptLabel = document.createElement('label');
      promptLabel.className = 'persona-prompt-label';
      promptLabel.textContent = currentLang === 'zh' ? '系统提示词' : 'System Prompt';

      const promptInput = document.createElement('textarea');
      promptInput.className = 'persona-prompt-input' + (!isActive ? ' persona-prompt-collapsed' : '');
      promptInput.placeholder = I18N[currentLang].personaPromptPlaceholder || 'System Prompt...';
      promptInput.value = persona.prompt;
      promptInput.addEventListener('input', (e) => { personas[index].prompt = e.target.value; scheduleSave(); });
      promptInput.addEventListener('click', (e) => e.stopPropagation());
      promptInput.addEventListener('mousedown', (e) => e.stopPropagation());

      // Toggle active button
      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'persona-toggle-btn';
      if (isActive) {
        toggleBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> ' +
          (I18N[currentLang].statusActive || 'Active');
      } else {
        toggleBtn.textContent = I18N[currentLang].toggleSetAsActive || 'Set as Active';
        toggleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          activePersonaId = persona.id;
          renderPersonas();
          scheduleSave();
        });
      }

      card.appendChild(header);
      card.appendChild(promptLabel);
      card.appendChild(promptInput);
      card.appendChild(toggleBtn);
      personaList.appendChild(card);
    });
  }

  // Add persona
  const addPersonaBtn = document.getElementById('addPersonaBtn');
  if (addPersonaBtn) {
    addPersonaBtn.addEventListener('click', () => {
      const newId = Math.random().toString(36).substr(2, 9);
      personas.push({ id: newId, name: '', prompt: '' });
      activePersonaId = newId;
      renderPersonas();
      scheduleSave();
      // Focus the name input of the newly created (last) card
      setTimeout(() => {
        if (!personaList) return;
        const cards = personaList.querySelectorAll('.persona-card');
        const lastCard = cards[cards.length - 1];
        if (lastCard) {
          const nameInput = lastCard.querySelector('.persona-name-input');
          if (nameInput) nameInput.focus();
        }
      }, 50);
    });
  }

  // Template Library
  const templateLibraryBtn = document.getElementById('templateLibraryBtn');
  const templateModal = document.getElementById('templateModal');
  const templateGrid = document.getElementById('templateGrid');
  const closeTemplateBtn = document.getElementById('closeTemplateBtn');

  function renderTemplateLibrary() {
    if (!templateGrid) return;
    templateGrid.innerHTML = '';
    PERSONA_TEMPLATES.forEach(template => {
      const card = document.createElement('div');
      card.className = 'persona-card';
      card.style.cursor = 'pointer';

      const header = document.createElement('div');
      header.className = 'persona-card-header';

      const avatar = document.createElement('div');
      avatar.className = 'persona-avatar';
      avatar.textContent = template.icon;

      const info = document.createElement('div');
      info.className = 'persona-info';

      const name = document.createElement('div');
      name.style.cssText = 'font-size:14px;font-weight:600;color:var(--text-primary);margin-bottom:4px;';
      name.textContent = I18N[currentLang][template.nameKey] || template.nameKey;

      const desc = document.createElement('div');
      desc.style.cssText = 'font-size:12px;color:var(--text-secondary);';
      desc.textContent = I18N[currentLang][template.descKey] || template.descKey;

      info.appendChild(name);
      info.appendChild(desc);
      header.appendChild(avatar);
      header.appendChild(info);
      card.appendChild(header);

      card.addEventListener('click', () => {
        const newId = Math.random().toString(36).substr(2, 9);
        personas.push({
          id: newId,
          name: I18N[currentLang][template.nameKey] || template.nameKey,
          prompt: template.prompt
        });
        if (!activePersonaId) activePersonaId = newId;
        renderPersonas();
        scheduleSave();
        if (templateModal) closeModal(templateModal);
        showToast((I18N[currentLang].templateAdded || 'Template added: {name}').replace('{name}', I18N[currentLang][template.nameKey] || template.nameKey));
      });

      templateGrid.appendChild(card);
    });
  }

  if (templateLibraryBtn) {
    templateLibraryBtn.addEventListener('click', () => {
      renderTemplateLibrary();
      if (templateModal) openModal(templateModal);
    });
  }
  if (closeTemplateBtn) {
    closeTemplateBtn.addEventListener('click', () => { if (templateModal) closeModal(templateModal); });
  }
  if (templateModal) {
    templateModal.addEventListener('click', (e) => { if (e.target === templateModal) closeModal(templateModal); });
  }

  // ---- Live Preview ----
  const previewChat = document.getElementById('previewChat');
  const previewInput = document.getElementById('previewInput');
  const previewSendBtn = document.getElementById('previewSendBtn');

  function addPreviewMessage(text, type) {
    if (!previewChat) return;
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble ' + type;
    bubble.textContent = text;
    previewChat.appendChild(bubble);
    // 限制 DOM 气泡数量
    const bubbles = previewChat.querySelectorAll('.chat-bubble');
    if (bubbles.length > 20) {
      for (let i = 0; i < bubbles.length - 20; i++) {
        bubbles[i].remove();
      }
    }
    previewChat.scrollTop = previewChat.scrollHeight;
  }

  if (previewSendBtn) {
    previewSendBtn.addEventListener('click', async () => {
      const text = previewInput?.value.trim();
      if (!text) return;
      if (!previewChat) return;
      addPreviewMessage(text, 'user');
      if (previewInput) previewInput.value = '';

      const thinkingBubble = document.createElement('div');
      thinkingBubble.className = 'chat-bubble ai';
      thinkingBubble.innerHTML = '<span style="opacity:0.5;">' + escapeHtml(I18N[currentLang].previewThinking || 'AI thinking...') + '</span>';
      previewChat.appendChild(thinkingBubble);
      previewChat.scrollTop = previewChat.scrollHeight;

      try {
        const historyMessages = [];
        previewChat.querySelectorAll('.chat-bubble').forEach((bubble) => {
          if (bubble !== thinkingBubble) {
            historyMessages.push({
              role: bubble.classList.contains('user') ? 'user' : 'assistant',
              content: bubble.textContent
            });
          }
        });

        // 限制预览历史最多 20 条消息
        if (historyMessages.length >= 20) {
          historyMessages.splice(0, historyMessages.length - 19);
        }

        const response = await Promise.race([
          chrome.runtime.sendMessage({ action: 'previewChat', messages: historyMessages }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out, please try again')), 35000))
        ]);

        if (response?.success && response.reply) {
          thinkingBubble.textContent = response.reply;
          thinkingBubble.style.opacity = '1';
        } else {
          thinkingBubble.innerHTML = '<span style="color:var(--error);">' + escapeHtml(I18N[currentLang].previewError || 'Error: ') + escapeHtml(response?.error || '') + '</span>';
        }
      } catch (error) {
        thinkingBubble.innerHTML = '<span style="color:var(--error);">' + escapeHtml(I18N[currentLang].previewError || 'Error: ') + escapeHtml(error.message) + '</span>';
      }
    });
  }

  // Enter key to send preview
  if (previewInput) {
    previewInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && previewSendBtn) previewSendBtn.click();
    });
  }

  // ---- FAQ Rendering ----
  const faqList = document.getElementById('faqList');
  const faqSearchInput = document.getElementById('faqSearch');
  const faqCategoryFilter = document.getElementById('faqCategoryFilter');
  const faqBatchToolbar = document.getElementById('faqBatchToolbar');
  const faqSelectAll = document.getElementById('faqSelectAll');
  const batchCount = document.getElementById('batchCount');
  const batchDeleteBtn = document.getElementById('batchDeleteBtn');
  const batchCategorySelect = document.getElementById('batchCategorySelect');
  const smartCategorizeBtn = document.getElementById('smartCategorizeBtn');

  function getFaqCategories() {
    return {
      product: { label: I18N[currentLang].catProduct || 'Product', color: '#667eea' },
      price: { label: I18N[currentLang].catPrice || 'Pricing', color: '#34c759' },
      service: { label: I18N[currentLang].catService || 'Service', color: '#ff9500' },
      other: { label: I18N[currentLang].catOther || 'Other', color: '#86868b' }
    };
  }

  function updateBatchToolbar() {
    if (!faqBatchToolbar || !batchCount) return;
    const count = selectedFaqIndices.size;
    batchCount.textContent = (I18N[currentLang].batchCountPrefix || '') + count + (I18N[currentLang].batchCountSuffix || ' selected');
    faqBatchToolbar.style.display = count > 0 ? 'flex' : 'none';
    const visibleItems = faqList?.querySelectorAll('.faq-item') || [];
    const allVisibleSelected = visibleItems.length > 0 && Array.from(visibleItems).every(item => {
      const cb = item.querySelector('.faq-item-checkbox');
      return cb && cb.checked;
    });
    if (faqSelectAll) faqSelectAll.checked = allVisibleSelected;
  }

  function renderFaq() {
    if (!faqList) return;
    faqList.innerHTML = '';

    const filteredFaq = [];
    faqData.forEach((item, index) => {
      if (faqCategoryQuery !== 'all' && item.category !== faqCategoryQuery) return;
      if (faqSearchQuery) {
        const query = faqSearchQuery.toLowerCase();
        if (!item.q.toLowerCase().includes(query) && !item.a.toLowerCase().includes(query)) return;
      }
      filteredFaq.push({ item, originalIndex: index });
    });

    if (filteredFaq.length === 0) {
      const noResults = document.createElement('div');
      noResults.className = 'empty-state';
      if (faqData.length === 0) {
        noResults.innerHTML = '<div class="empty-state-icon">📚</div>' +
          '<div class="empty-state-title">' +
          escapeHtml(I18N[currentLang].emptyFaq || 'No knowledge base entries') + '</div>' +
          '<div class="empty-state-desc">' + escapeHtml(I18N[currentLang].faqHelp || 'Click "Add Q&A" to create one.') + '</div>';
        const ctaRow = document.createElement('div');
        ctaRow.className = 'empty-state-cta';

        const cta = document.createElement('button');
        cta.className = 'btn btn-primary';
        cta.textContent = I18N[currentLang].emptyFaqCta || 'Add First Entry';
        cta.addEventListener('click', () => {
          if (addFaqBtn) addFaqBtn.click();
        });

        ctaRow.appendChild(cta);
        noResults.appendChild(ctaRow);
      } else {
        faqList.appendChild(createEmptyState(I18N[currentLang].noMatchingFaq || 'No matching Q&A found'));
        updateBatchToolbar();
        return;
      }
      faqList.appendChild(noResults);
      updateBatchToolbar();
      return;
    }

    filteredFaq.forEach(({ item, originalIndex: index }) => {
      const div = document.createElement('div');
      div.className = 'faq-item' + (selectedFaqIndices.has(index) ? ' selected' : '');

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'faq-item-checkbox';
      checkbox.id = 'faq-' + index;
      checkbox.checked = selectedFaqIndices.has(index);
      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) selectedFaqIndices.add(index);
        else selectedFaqIndices.delete(index);
        updateBatchToolbar();
      });

      const headerRow = document.createElement('div');
      headerRow.className = 'faq-item-header';
      headerRow.appendChild(checkbox);

      const cats = getFaqCategories();
      const catSelect = document.createElement('select');
      catSelect.className = 'faq-item-input';
      catSelect.style.cssText = 'width:auto;min-width:100px;flex:0;';
      Object.entries(cats).forEach(([key, info]) => {
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = info.label;
        if (key === (item.category || 'other')) opt.selected = true;
        catSelect.appendChild(opt);
      });
      catSelect.addEventListener('change', (e) => { faqData[index].category = e.target.value; scheduleSave(); });

      const delBtn = document.createElement('button');
      delBtn.className = 'btn-sm btn-destructive';
      delBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
      delBtn.addEventListener('click', () => {
        // Delete with undo
        const deletedItem = faqData.splice(index, 1)[0];
        deletedFaqUndo = { items: [{ item: deletedItem, index }], timer: null };
        renderFaq();
        scheduleSave();

        // 使用 showToast action 集成 Undo（建议 8）
        showToast(
          I18N[currentLang].deletedFaq || 'Deleted 1 Q&A item',
          false,
          I18N[currentLang].undoDelete || 'Undo',
          () => {
            if (!deletedFaqUndo) return;
            faqData.splice(deletedFaqUndo.items[0].index, 0, deletedFaqUndo.items[0].item);
            deletedFaqUndo = null;
            renderFaq();
            scheduleSave();
          }
        );
        if (deletedFaqUndo) {
          deletedFaqUndo.timer = setTimeout(() => {
            deletedFaqUndo = null;
          }, 6000);
        }
      });

      headerRow.appendChild(catSelect);
      headerRow.appendChild(delBtn);
      div.appendChild(headerRow);

      const qInput = document.createElement('input');
      qInput.className = 'faq-item-input question';
      qInput.placeholder = I18N[currentLang].questionLabel || 'Question';
      qInput.value = item.q;
      qInput.style.marginBottom = '8px';
      qInput.addEventListener('input', (e) => { faqData[index].q = e.target.value; scheduleSave(); });

      const aInput = document.createElement('textarea');
      aInput.className = 'faq-item-input';
      aInput.placeholder = I18N[currentLang].answerLabel || 'Answer';
      aInput.value = item.a;
      aInput.rows = 3;
      aInput.addEventListener('input', (e) => { faqData[index].a = e.target.value; scheduleSave(); });

      div.appendChild(qInput);
      div.appendChild(aInput);
      faqList.appendChild(div);
    });

    updateBatchToolbar();
  }

  if (faqSearchInput) {
    const debouncedRenderFaq = debounce(() => renderFaq(), 200);
    faqSearchInput.addEventListener('input', (e) => {
      faqSearchQuery = e.target.value.trim();
      debouncedRenderFaq();
    });
  }
  if (faqCategoryFilter) {
    faqCategoryFilter.addEventListener('change', (e) => { faqCategoryQuery = e.target.value; renderFaq(); });
  }

  // Select all
  if (faqSelectAll) {
    faqSelectAll.addEventListener('change', (e) => {
      if (!faqList) return;
      faqList.querySelectorAll('.faq-item-checkbox').forEach(cb => {
        cb.checked = e.target.checked;
        const idx = parseInt(cb.id.replace('faq-', ''));
        if (e.target.checked) selectedFaqIndices.add(idx);
        else selectedFaqIndices.delete(idx);
      });
      updateBatchToolbar();
    });
  }

  // Batch delete
  if (batchDeleteBtn) {
    batchDeleteBtn.addEventListener('click', async () => {
      if (selectedFaqIndices.size === 0) return;
      const count = selectedFaqIndices.size;
      const confirmed = await showConfirm(I18N[currentLang].confirmBatchDelete.replace('{n}', count) || '确认删除', I18N[currentLang].confirmBatchDelete.replace('{n}', count));
      if (!confirmed) return;
      const sortedIndices = Array.from(selectedFaqIndices).sort((a, b) => b - a);
      sortedIndices.forEach(idx => faqData.splice(idx, 1));
      selectedFaqIndices.clear();
      renderFaq();
      scheduleSave();
      showToast((I18N[currentLang].deletedCount || 'Deleted {n}').replace('{n}', count));
    });
  }

  // Batch category
  if (batchCategorySelect) {
    batchCategorySelect.addEventListener('change', (e) => {
      const category = e.target.value;
      if (!category || selectedFaqIndices.size === 0) return;
      selectedFaqIndices.forEach(idx => { if (faqData[idx]) faqData[idx].category = category; });
      e.target.value = '';
      renderFaq();
      scheduleSave();
      showToast((I18N[currentLang].categoryUpdated || 'Updated {n}').replace('{n}', selectedFaqIndices.size));
    });
  }

  // Smart categorize
  if (smartCategorizeBtn) {
    smartCategorizeBtn.addEventListener('click', () => {
      let changedCount = 0;
      faqData.forEach((item) => {
        const text = (item.q + ' ' + item.a).toLowerCase();
        let predictedCategory = 'other';
        if (/price|cost|payment|pay|cheap|expensive|discount|refund|美元|价格|费用|付款|支付|便宜|贵|折扣|退款|钱/i.test(text)) {
          predictedCategory = 'price';
        } else if (/product|item|feature|specification|size|color|material|quality|warranty|产品|商品|物品|功能|规格|尺寸|颜色|材质|质量|保修|型号/i.test(text)) {
          predictedCategory = 'product';
        } else if (/service|support|help|return|exchange|shipping|delivery|track|warranty|repair|服务|支持|帮助|退货|换货|发货|物流|跟踪|维修|售后/i.test(text)) {
          predictedCategory = 'service';
        }
        if (item.category !== predictedCategory) { item.category = predictedCategory; changedCount++; }
      });
      renderFaq();
      scheduleSave();
      showToast((I18N[currentLang].smartCategorizeDone || 'Updated {n}').replace('{n}', changedCount));
    });
  }

  // Add FAQ
  const addFaqBtn = document.getElementById('addFaqBtn');
  if (addFaqBtn) {
    addFaqBtn.addEventListener('click', () => { faqData.push({ q: '', a: '', category: 'other' }); renderFaq(); scheduleSave(); });
  }

  // FAQ Import/Export
  const importFaqBtn = document.getElementById('importFaqBtn');
  const exportFaqBtn = document.getElementById('exportFaqBtn');
  const faqFileInput = document.getElementById('faqFileInput');

  if (importFaqBtn && faqFileInput) {
    importFaqBtn.addEventListener('click', () => faqFileInput.click());
    faqFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          if (Array.isArray(imported)) {
            const validItems = imported.filter(item => item.q && item.a).map(item => ({ ...item, category: item.category || 'other' }));
            if (validItems.length > 0) {
              faqData = [...faqData, ...validItems];
              renderFaq();
              scheduleSave();
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
  }

  if (exportFaqBtn) {
    exportFaqBtn.addEventListener('click', () => {
      const validFaq = faqData.filter(f => f.q.trim() && f.a.trim());
      if (validFaq.length === 0) { showToast(I18N[currentLang].exportNone || 'No Q&A items to export', true); return; }
      const dataStr = JSON.stringify(validFaq, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'faq-export-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast((I18N[currentLang].exportSuccess || 'Exported {n}').replace('{n}', validFaq.length));
    });
  }

  // ---- Shortcut ----
  const shortcutInput = document.getElementById('shortcut');
  const shortcutRecorder = document.getElementById('shortcutRecorder');

  // ---- 悬浮按钮主题预览 ----
  const btnThemeSelect = document.getElementById('btnTheme');
  const themePreviewBtn = document.getElementById('themePreviewBtn');
  function updateThemePreview(theme) {
    if (!themePreviewBtn) return;
    themePreviewBtn.className = 'theme-preview-btn theme-' + (theme || 'gradient');
  }
  if (btnThemeSelect) {
    btnThemeSelect.addEventListener('change', () => updateThemePreview(btnThemeSelect.value));
  }

  // 快捷键录入：点击按钮进入录制模式，按下组合键保存
  let isRecordingShortcut = false;
  if (shortcutRecorder) {
    shortcutRecorder.addEventListener('click', () => {
      if (isRecordingShortcut) return;
      isRecordingShortcut = true;
      shortcutRecorder.classList.add('recording');
      shortcutRecorder.classList.remove('conflict');
      shortcutRecorder.textContent = '按下组合键...';
    });

    document.addEventListener('keydown', (e) => {
      if (!isRecordingShortcut) return;
      e.preventDefault();
      e.stopPropagation();

      // Esc 取消录制
      if (e.key === 'Escape') {
        isRecordingShortcut = false;
        shortcutRecorder.classList.remove('recording');
        chrome.storage.sync.get({ shortcut: 'Alt + 1' }, (data) => {
          shortcutRecorder.textContent = data.shortcut || '未设置';
        });
        return;
      }

      // 必须含修饰键（避免单字母被注册为快捷键导致输入冲突）
      if (!e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey) {
        shortcutRecorder.classList.add('conflict');
        shortcutRecorder.textContent = '需含修饰键';
        return;
      }

      const keys = [];
      if (e.ctrlKey) keys.push('Ctrl');
      if (e.altKey) keys.push('Alt');
      if (e.shiftKey) keys.push('Shift');
      if (e.metaKey) keys.push('Cmd');
      // 忽略修饰键本身，只记录主键
      const mainKey = e.key.replace('Control', '').replace('Alt', '').replace('Shift', '').replace('Meta', '');
      if (mainKey) keys.push(mainKey.length === 1 ? mainKey.toUpperCase() : mainKey);

      const combo = keys.join(' + ');

      // 冲突检查：与浏览器/扩展内固定快捷键冲突
      const FIXED_SHORTCUTS = ['Ctrl + Enter', 'Ctrl + R', 'Ctrl + Shift + N', 'Ctrl + T', 'Ctrl + W'];
      if (FIXED_SHORTCUTS.includes(combo)) {
        isRecordingShortcut = false;
        shortcutRecorder.classList.remove('recording');
        shortcutRecorder.classList.add('conflict');
        shortcutRecorder.textContent = combo + ' 冲突';
        setTimeout(() => {
          shortcutRecorder.classList.remove('conflict');
          chrome.storage.sync.get({ shortcut: 'Alt + 1' }, (data) => {
            shortcutRecorder.textContent = data.shortcut || '未设置';
          });
        }, 1500);
        return;
      }

      // 保存
      isRecordingShortcut = false;
      shortcutRecorder.classList.remove('recording');
      shortcutRecorder.textContent = combo;
      chrome.storage.sync.set({ shortcut: combo });
      if (shortcutInput) shortcutInput.value = combo;
    });
  }

  // ---- API Configuration ----
  const apiProvider = document.getElementById('apiProvider');
  const apiKeyInput = document.getElementById('apiKey');
  const testApiBtn = document.getElementById('testApiBtn');
  const apiStatusIndicator = document.getElementById('apiStatusIndicator');
  const apiStatusText = document.getElementById('apiStatusText');

  // Load API providers from models-config.json dynamically
  async function loadApiProviders(targetSelect) {
    const select = targetSelect || apiProvider;
    if (!select) return;
    try {
      let resp;
      if (chrome.runtime && chrome.runtime.getURL) {
        resp = await fetch(chrome.runtime.getURL('models-config.json'));
      } else {
        resp = await fetch('models-config.json');
      }
      const config = await resp.json();
      modelsConfig = config;

      const currentValue = select.value;
      const internationalIds = ['openai', 'anthropic', 'google', 'openrouter', 'custom'];
      select.innerHTML = '';

      const intlGroup = document.createElement('optgroup');
      intlGroup.label = currentLang === 'zh' ? '国际厂商' : 'International';
      const domesticGroup = document.createElement('optgroup');
      domesticGroup.label = currentLang === 'zh' ? '国内厂商' : 'Domestic';

      (config.providers || []).forEach(provider => {
        const opt = document.createElement('option');
        opt.value = provider.id;
        opt.textContent = provider.name;
        if (internationalIds.includes(provider.id)) {
          intlGroup.appendChild(opt);
        } else {
          domesticGroup.appendChild(opt);
        }
      });

      // Domestic first (primary audience), then international
      select.appendChild(domesticGroup);
      select.appendChild(intlGroup);

      if (currentValue) {
        select.value = currentValue;
      }
      updateApiProviderUI(select.value);
    } catch (err) {
      console.error('Failed to load models config:', err);
    }
  }

  // ================================
  // 远程推荐配置热更新
  // ================================
  const REMOTE_CONFIG_TTL = 24 * 60 * 60 * 1000; // 24 小时

  async function fetchRemoteProviderConfig() {
    try {
      const stored = await chrome.storage.local.get(['remoteProviderConfig', 'remoteConfigFetchedAt']);
      const now = Date.now();
      // 24 小时内使用缓存
      if (stored.remoteProviderConfig && stored.remoteConfigFetchedAt && (now - stored.remoteConfigFetchedAt < REMOTE_CONFIG_TTL)) {
        mergeRemoteConfig(stored.remoteProviderConfig);
        return;
      }
      // 拉取远程配置
      const resp = await fetch(API_BASE_URL + '/api/config/providers');
      if (!resp.ok) return;
      const remoteConfig = await resp.json();
      if (!remoteConfig?.recommended) return;
      // 缓存到 local storage
      chrome.storage.local.set({
        remoteProviderConfig: remoteConfig,
        remoteConfigFetchedAt: now
      });
      mergeRemoteConfig(remoteConfig);
    } catch (e) {
      // 静默失败，使用本地兜底配置
    }
  }

  // 将远程推荐配置合并到本地 modelsConfig
  function mergeRemoteConfig(remoteConfig) {
    if (!modelsConfig?.providers || !remoteConfig?.recommended) return;
    remoteConfig.recommended.forEach(remote => {
      if (!remote.enabled) return;
      const local = modelsConfig.providers.find(p => p.id === remote.id);
      if (!local) return;
      // 远程配置覆盖本地的导购字段
      if (remote.priority !== undefined) local.priority = remote.priority;
      if (remote.tags) local.tags = remote.tags;
      if (remote.scenario) local.scenario = remote.scenario;
      if (remote.costEstimate) local.costEstimate = remote.costEstimate;
      if (remote.costNote) local.costNote = remote.costNote;
      local.recommended = true;
    });
  }

  // 智能 Key 格式校验
  function validateKeyFormat(providerId, key) {
    if (!key || key.length < 10) return null;
    const provider = (modelsConfig?.providers || []).find(p => p.id === providerId);
    if (!provider?.keyPattern) return null;
    try {
      const regex = new RegExp(provider.keyPattern);
      return regex.test(key);
    } catch (e) {
      return null;
    }
  }

  // 更新 Key 校验 UI
  function updateKeyValidation(providerId, key, context) {
    const validationId = context === 'onboarding' ? 'onboardingKeyValidation' : 'settingsKeyValidation';
    const validationEl = document.getElementById(validationId);
    if (!validationEl) return;

    const result = validateKeyFormat(providerId, key);
    if (result === true) {
      validationEl.textContent = '✓ 格式正确';
      validationEl.className = 'key-validation-hint valid';
    } else if (result === false) {
      validationEl.textContent = '✗ Key 格式似乎不正确，请检查是否复制完整';
      validationEl.className = 'key-validation-hint invalid';
    } else {
      validationEl.textContent = '';
      validationEl.className = 'key-validation-hint';
    }
  }

  // 拟人化错误提示
  function getFriendlyError(status, providerName) {
    const zh = currentLang === 'zh';
    switch (status) {
      case 401: case 403:
        return zh ? 'Key 似乎无效，请检查是否复制完整' : 'Key appears invalid, please check';
      case 429:
        return zh ? (providerName + ' 余额不足或请求频繁，请先充值') : 'Rate limited or insufficient balance';
      case 402:
        return zh ? (providerName + ' 余额不足，请先充值') : 'Insufficient balance';
      default:
        return zh ? ('连接失败 (' + status + ')，请稍后重试') : ('Connection failed (' + status + ')');
    }
  }

  // 通用测试连接逻辑（卡片模式和高级模式共用）
  async function doTestConnection(providerId, apiKey, resultEl, btnEl) {
    if (!apiKey) {
      if (resultEl) {
        resultEl.textContent = currentLang === 'zh' ? '请先输入 API Key' : 'Please enter API Key';
        resultEl.style.color = 'var(--error)';
      }
      return;
    }

    if (btnEl) { btnEl.disabled = true; btnEl.textContent = currentLang === 'zh' ? '测试中...' : 'Testing...'; }
    if (resultEl) { resultEl.textContent = currentLang === 'zh' ? '正在测试连接...' : 'Testing connection...'; resultEl.style.color = 'var(--text-secondary)'; }

    try {
      let testUrl, headers, body;
      const providerConfig = modelsConfig?.providers?.find(p => p.id === providerId);

      if (providerId === 'anthropic') {
        testUrl = (providerConfig?.url) || 'https://api.anthropic.com/v1/messages';
        headers = { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' };
        body = JSON.stringify({ model: 'claude-3-haiku-20240307', max_tokens: 10, messages: [{ role: 'user', content: 'Hi' }] });
      } else if (providerId === 'google') {
        testUrl = (providerConfig?.url) || 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
        headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey };
        body = JSON.stringify({ model: 'gemini-2.0-flash', messages: [{ role: 'user', content: 'Hi' }], max_tokens: 10 });
      } else {
        testUrl = (providerConfig?.url) || 'https://api.openai.com/v1/chat/completions';
        headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey };
        const testModel = (providerConfig?.models || []).find(m => m.recommended)?.id
          || (providerConfig?.models || [])[0]?.id || 'gpt-3.5-turbo';
        body = JSON.stringify({ model: testModel, messages: [{ role: 'user', content: 'Hi' }], max_tokens: 10 });
      }

      const response = await fetch(testUrl, { method: 'POST', headers, body });
      if (response.ok) {
        if (resultEl) { resultEl.textContent = '✓ ' + (currentLang === 'zh' ? '连接成功！' : 'Connection successful!'); resultEl.style.color = 'var(--success)'; }
        if (apiStatusIndicator) { apiStatusIndicator.className = 'api-status-pill connected'; }
        if (apiStatusText) { apiStatusText.textContent = I18N[currentLang].apiConnected || 'Connected'; }
        chrome.storage.sync.set({ connectionValid: true });
        // 测试通过后隐藏 API 指南 banner
        const banner = document.getElementById('apiGuideBanner');
        if (banner) banner.classList.add('hidden');
      } else {
        const errMsg = getFriendlyError(response.status, providerConfig?.name || providerId);
        if (resultEl) { resultEl.textContent = '✗ ' + errMsg; resultEl.style.color = 'var(--error)'; }
        if (apiStatusIndicator) { apiStatusIndicator.className = 'api-status-pill disconnected'; }
        if (apiStatusText) { apiStatusText.textContent = I18N[currentLang].apiDisconnected || 'Not connected'; }
        chrome.storage.sync.set({ connectionValid: false });
      }
    } catch (error) {
      const errMsg = currentLang === 'zh' ? '网络连接失败，请检查网络' : 'Network connection failed';
      if (resultEl) { resultEl.textContent = '✗ ' + errMsg; resultEl.style.color = 'var(--error)'; }
      if (apiStatusIndicator) { apiStatusIndicator.className = 'api-status-pill disconnected'; }
      if (apiStatusText) { apiStatusText.textContent = I18N[currentLang].apiDisconnected || 'Not connected'; }
      chrome.storage.sync.set({ connectionValid: false });
    } finally {
      if (btnEl) { btnEl.disabled = false; btnEl.textContent = currentLang === 'zh' ? '测试连接' : 'Test Connection'; }
    }
  }

  // ================================
  // 自定义模型测试连接（设置页：用户直接填写 URL + Key + 模型名）
  // ================================

  // 规范化 API 端点：补全 /chat/completions 或 /messages 后缀
  function buildTestEndpoint(apiUrl) {
    let url = (apiUrl || '').trim().replace(/\/+$/, '');
    if (!url) return url;
    if (url.includes('api.anthropic.com')) {
      return url.endsWith('/messages') ? url : url + '/messages';
    }
    return (url.endsWith('/chat/completions') || url.endsWith('/messages')) ? url : url + '/chat/completions';
  }

  async function doTestConnectionCustom(apiUrl, apiKey, modelName, resultEl, btnEl) {
    if (!apiUrl || !apiKey) {
      if (resultEl) {
        resultEl.textContent = currentLang === 'zh' ? '请填写 API 地址和 API Key' : 'Please fill API URL and Key';
        resultEl.style.color = 'var(--error)';
      }
      return;
    }
    if (!modelName) modelName = 'gpt-3.5-turbo';

    if (btnEl) { btnEl.disabled = true; btnEl.textContent = currentLang === 'zh' ? '测试中...' : 'Testing...'; }
    if (resultEl) { resultEl.textContent = currentLang === 'zh' ? '正在测试连接...' : 'Testing connection...'; resultEl.style.color = 'var(--text-secondary)'; }

    try {
      const testUrl = buildTestEndpoint(apiUrl);
      const isAnthropic = testUrl.includes('api.anthropic.com');
      let headers, body;
      if (isAnthropic) {
        headers = { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' };
        body = JSON.stringify({ model: modelName, max_tokens: 10, messages: [{ role: 'user', content: 'Hi' }] });
      } else {
        headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey };
        body = JSON.stringify({ model: modelName, messages: [{ role: 'user', content: 'Hi' }], max_tokens: 10 });
      }

      const response = await fetch(testUrl, { method: 'POST', headers, body });
      if (response.ok) {
        if (resultEl) { resultEl.textContent = '✓ ' + (currentLang === 'zh' ? '连接成功！' : 'Connection successful!'); resultEl.style.color = 'var(--success)'; }
        if (apiStatusIndicator) { apiStatusIndicator.className = 'api-status-pill connected'; }
        if (apiStatusText) { apiStatusText.textContent = I18N[currentLang].apiConnected || 'Connected'; }
        chrome.storage.sync.set({ connectionValid: true });
        // 测试通过后隐藏 API 指南 banner
        const banner = document.getElementById('apiGuideBanner');
        if (banner) banner.classList.add('hidden');
      } else {
        const errMsg = getFriendlyError(response.status, modelName);
        if (resultEl) { resultEl.textContent = '✗ ' + errMsg; resultEl.style.color = 'var(--error)'; }
        if (apiStatusIndicator) { apiStatusIndicator.className = 'api-status-pill disconnected'; }
        if (apiStatusText) { apiStatusText.textContent = I18N[currentLang].apiDisconnected || 'Not connected'; }
        chrome.storage.sync.set({ connectionValid: false });
      }
    } catch (error) {
      const errMsg = currentLang === 'zh' ? '网络连接失败，请检查网络或 API 地址' : 'Network connection failed';
      if (resultEl) { resultEl.textContent = '✗ ' + errMsg; resultEl.style.color = 'var(--error)'; }
      if (apiStatusIndicator) { apiStatusIndicator.className = 'api-status-pill disconnected'; }
      if (apiStatusText) { apiStatusText.textContent = I18N[currentLang].apiDisconnected || 'Not connected'; }
      chrome.storage.sync.set({ connectionValid: false });
    } finally {
      if (btnEl) { btnEl.disabled = false; btnEl.textContent = currentLang === 'zh' ? '测试连接' : 'Test Connection'; }
    }
  }

  // Update API Key placeholder and "Get Key" link based on selected provider
  function updateApiProviderUI(providerId) {
    if (!modelsConfig) return;
    const provider = (modelsConfig.providers || []).find(p => p.id === providerId);
    if (!provider) return;
    if (apiKeyInput) {
      apiKeyInput.placeholder = (currentLang === 'zh' ? '请输入 ' : 'Enter ') + provider.name + ' API Key';
    }
    const getKeyLink = document.getElementById('getKeyLink');
    if (getKeyLink) {
      if (provider.getKey) {
        getKeyLink.href = provider.getKey;
        getKeyLink.style.display = '';
      } else {
        getKeyLink.style.display = 'none';
      }
    }
  }

  if (apiProvider) {
    apiProvider.addEventListener('change', () => {
      updateApiProviderUI(apiProvider.value);
      scheduleSave();
    });
  }
  if (apiKeyInput) {
    apiKeyInput.addEventListener('input', () => {
      scheduleSave();
    });
  }

  // 自定义模型表单：URL / 模型名输入自动保存
  const apiUrlInputEl = document.getElementById('apiUrlInput');
  const modelNameInputEl = document.getElementById('modelNameInput');
  if (apiUrlInputEl) apiUrlInputEl.addEventListener('input', scheduleSave);
  if (modelNameInputEl) modelNameInputEl.addEventListener('input', scheduleSave);

  // 高级模式 API Key 输入同步
  const apiKeyAdvancedInput = document.getElementById('apiKeyAdvanced');
  if (apiKeyAdvancedInput) {
    apiKeyAdvancedInput.addEventListener('input', () => {
      // 同步到卡片模式输入框
      if (apiKeyInput && apiKeyInput.value !== apiKeyAdvancedInput.value) {
        apiKeyInput.value = apiKeyAdvancedInput.value;
      }
      scheduleSave();
    });
  }

  // 高级模式 API Key show/hide toggle
  const apiKeyAdvancedToggle = document.getElementById('apiKeyAdvancedToggle');
  if (apiKeyAdvancedToggle && apiKeyAdvancedInput) {
    apiKeyAdvancedToggle.addEventListener('click', () => {
      apiKeyAdvancedInput.type = apiKeyAdvancedInput.type === 'password' ? 'text' : 'password';
    });
  }

  // API Key show/hide toggle
  const apiKeyToggle = document.getElementById('apiKeyToggle');
  if (apiKeyToggle && apiKeyInput) {
    apiKeyToggle.addEventListener('click', () => {
      if (apiKeyInput.type === 'password') {
        apiKeyInput.type = 'text';
        apiKeyToggle.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
      } else {
        apiKeyInput.type = 'password';
        apiKeyToggle.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
      }
    });
  }

  // API 指南 banner 关闭
  const apiGuideBannerClose = document.getElementById('apiGuideBannerClose');
  if (apiGuideBannerClose) {
    apiGuideBannerClose.addEventListener('click', () => {
      const banner = document.getElementById('apiGuideBanner');
      if (banner) banner.classList.add('hidden');
    });
  }

  // Settings page test connection — 卡片模式
  // 保存 API 配置按钮：独立保存 + 智能状态保持
  const saveApiBtn = document.getElementById('saveApiBtn');
  if (saveApiBtn) {
    saveApiBtn.addEventListener('click', async () => {
      const zh = currentLang === 'zh';
      const apiUrl = document.getElementById('apiUrlInput')?.value.trim() || '';
      const apiKey = document.getElementById('apiKey')?.value.trim() || '';
      const modelName = document.getElementById('modelNameInput')?.value.trim() || '';

      if (!apiUrl || !apiKey || !modelName) {
        showToast(zh ? '请完整填写 API 地址、Key 和模型名' : 'Please fill URL, Key and model name', true);
        return;
      }

      // 读取已保存的旧配置，判断是否变化
      const oldConfig = await new Promise(resolve => {
        chrome.storage.local.get(['apiUrl', 'apiKey', 'modelName', 'savedApiFingerprint'], resolve);
      });
      const newFingerprint = apiUrl + '|' + apiKey + '|' + modelName;
      const oldFingerprint = oldConfig.savedApiFingerprint || '';

      // 保存新配置
      await new Promise(resolve => {
        chrome.storage.local.set({
          apiProvider: 'custom',
          apiUrl, apiKey, modelName,
          savedApiFingerprint: newFingerprint
        }, resolve);
      });

      // 状态保持逻辑：API 未变 → 保留原 connectionValid；变化 → 清空需重测
      if (newFingerprint !== oldFingerprint) {
        // API 变化：清空旧连接状态，避免显示错误的"已连接"
        await new Promise(resolve => {
          chrome.storage.sync.set({ connectionValid: null }, resolve);
        });
        showToast(zh ? '配置已保存，请点击「测试连接」验证' : 'Config saved. Click "Test Connection" to verify.');
      }
      // API 未变：静默保存，保留原连接状态，不弹 toast

      // 刷新状态栏
      updateApiStatusBar();
    });
  }

  if (testApiBtn) {
    testApiBtn.addEventListener('click', () => {
      const url = document.getElementById('apiUrlInput')?.value.trim() || '';
      const key = document.getElementById('apiKey')?.value.trim() || '';
      const model = document.getElementById('modelNameInput')?.value.trim() || '';
      const resultEl = document.getElementById('settingsKeyValidation');
      doTestConnectionCustom(url, key, model, resultEl, testApiBtn);
    });
  }

  // Settings page test connection — 高级模式
  const testApiAdvancedBtn = document.getElementById('testApiAdvancedBtn');
  if (testApiAdvancedBtn) {
    testApiAdvancedBtn.addEventListener('click', () => {
      const provider = document.getElementById('apiProvider')?.value || 'openai';
      const key = document.getElementById('apiKeyAdvanced')?.value.trim() || '';
      doTestConnection(provider, key, null, testApiAdvancedBtn);
    });
  }

  // ---- Account: License & Activation ----
  const licenseBadge = document.getElementById('licenseBadge');
  const licenseTypeEl = document.getElementById('licenseType');
  const upgradeBtn = document.getElementById('upgradeBtn');
  const activationCodeInput = document.getElementById('activationCodeInput');
  const activateBtn = document.getElementById('activateBtn');
  const activationError = document.getElementById('activationError');
  const activationSuccess = document.getElementById('activationSuccess');
  const licenseTypeDisplay = document.getElementById('licenseTypeDisplay');

  function updateLicenseDisplay(licenseType) {
    if (!licenseBadge || !licenseTypeEl) return;
    const typeNames = {
      'lifetime': I18N[currentLang].statProLifetime || 'Pro Lifetime',
      'year': I18N[currentLang].statProYear || 'Pro Year',
      'free': I18N[currentLang].statFree || 'Free'
    };
    licenseTypeEl.textContent = typeNames[licenseType] || licenseType;
    licenseBadge.className = 'license-badge ' + (licenseType === 'free' ? 'free' : 'pro');
  }

  if (activateBtn && activationCodeInput) {
    activateBtn.addEventListener('click', async () => {
      const code = activationCodeInput.value.trim();
      if (!code) {
        if (activationError) {
          activationError.textContent = I18N[currentLang].activateErrorEmpty || '请输入激活码';
          activationError.style.display = 'block';
        }
        return;
      }

      activateBtn.disabled = true;
      activateBtn.innerHTML = '<svg class="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-dasharray="60" stroke-dashoffset="40"></circle></svg><span>' + escapeHtml(I18N[currentLang].activateVerifying || '验证中...') + '</span>';
      if (activationError) activationError.style.display = 'none';

      try {
        // 获取设备指纹
        const fingerprint = await FingerprintUtil.getDeviceFingerprint();
        const timestamp = Date.now().toString();

        const response = await fetch(API_BASE_URL + '/api/license/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: code.toUpperCase(), fingerprint, timestamp })
        });
        const result = await response.json();

        if (result.valid && result.type) {
          // 激活成功（licenseCode 写入 local，licenseType/activatedAt 写入 sync）
          await chrome.storage.local.set({ licenseCode: code.toUpperCase() });
          await chrome.storage.sync.set({
            licenseType: result.type,
            activatedAt: result.activatedAt || new Date().toISOString()
          });
          if (activationSuccess) activationSuccess.style.display = 'flex';
          if (licenseTypeDisplay) licenseTypeDisplay.textContent = I18N[currentLang]['statPro' + (result.type === 'lifetime' ? 'Lifetime' : 'Year')] || result.type;
          activationCodeInput.value = '';
          updateLicenseDisplay(result.type);
          updateStats();
          updateFreeTierNotification();
          showToast((I18N[currentLang].activateSuccessPrefix || '激活成功！') + result.type);
          if (typeof window.__refreshDevices === 'function') window.__refreshDevices();
        } else if (result.needRebind) {
          // 设备池已满：弹窗选择要踢掉的旧设备
          const devices = Array.isArray(result.currentDevices) ? result.currentDevices : [];
          const deviceLines = devices.map((d, i) => {
            const name = d.name ? String(d.name).substring(0, 60) : '未知设备';
            const fp = d.fingerprint || '--------';
            const last = d.lastSeen ? new Date(d.lastSeen).toLocaleString() : '无记录';
            return `[${i + 1}] ${name}\n    指纹：${fp}\n    最后活跃：${last}`;
          }).join('\n\n');
          const msg =
            `已绑定 ${result.maxDevices} 台设备，需要先解绑一台旧设备才能激活。\n` +
            `本月剩余换绑次数：${result.remainingCount}\n\n` +
            `${deviceLines}\n\n请输入要解绑的设备序号（1-${devices.length}），取消则不激活：`;
          const input = prompt(msg);
          if (input === null) return;
          const idx = parseInt(input, 10) - 1;
          if (isNaN(idx) || idx < 0 || idx >= devices.length) {
            if (activationError) {
              activationError.textContent = '设备序号无效，已取消激活';
              activationError.style.display = 'block';
            }
            return;
          }
          await doRebind(code.toUpperCase(), fingerprint, timestamp, devices[idx].id);
        } else if (result.rebindPaused) {
          if (activationError) {
            activationError.textContent = result.error || '换绑功能已暂停';
            activationError.style.display = 'block';
          }
        } else {
          if (activationError) {
            activationError.textContent = result.error || (I18N[currentLang].activateErrorInvalid || '激活码无效');
            activationError.style.display = 'block';
          }
        }
      } catch (err) {
        if (activationError) {
          activationError.textContent = I18N[currentLang].activateFail || '网络错误，请检查网络连接';
          activationError.style.display = 'block';
        }
      } finally {
        activateBtn.disabled = false;
        activateBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg><span>' + escapeHtml(I18N[currentLang].activateLabel || '激活') + '</span>';
      }
    });

    // 换绑函数（设备池模式：需指定 unbindDeviceId）
    async function doRebind(code, fingerprint, timestamp, unbindDeviceId) {
      activateBtn.disabled = true;
      activateBtn.innerHTML = '<svg class="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-dasharray="60" stroke-dashoffset="40"></circle></svg><span>换绑中...</span>';
      if (activationError) activationError.style.display = 'none';
      try {
        const response = await fetch(API_BASE_URL + '/api/license/rebind', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, fingerprint, timestamp, unbindDeviceId })
        });
        const result = await response.json();
        if (result.valid && result.type) {
          await chrome.storage.local.set({ licenseCode: code });
          await chrome.storage.sync.set({
            licenseType: result.type,
            activatedAt: result.activatedAt || new Date().toISOString()
          });
          if (activationSuccess) activationSuccess.style.display = 'flex';
          if (licenseTypeDisplay) licenseTypeDisplay.textContent = I18N[currentLang]['statPro' + (result.type === 'lifetime' ? 'Lifetime' : 'Year')] || result.type;
          activationCodeInput.value = '';
          updateLicenseDisplay(result.type);
          updateStats();
          updateFreeTierNotification();
          showToast('换绑成功！');
          if (typeof window.__refreshDevices === 'function') window.__refreshDevices();
        } else {
          if (activationError) {
            activationError.textContent = result.error || '换绑失败';
            activationError.style.display = 'block';
          }
        }
      } catch (err) {
        if (activationError) {
          activationError.textContent = '网络错误';
          activationError.style.display = 'block';
        }
      } finally {
        activateBtn.disabled = false;
        activateBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg><span>' + escapeHtml(I18N[currentLang].activateLabel || '激活') + '</span>';
      }
    }

    activationCodeInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') activateBtn.click(); });
  }

  // === 设备管理 ===
  const deviceListEl = document.getElementById('deviceList');
  const deviceSlotsValueEl = document.getElementById('deviceSlotsValue');
  const deviceRebindValueEl = document.getElementById('deviceRebindValue');
  const refreshDevicesBtn = document.getElementById('refreshDevicesBtn');
  const deviceRebindPausedWarnEl = document.getElementById('deviceRebindPausedWarn');

  function formatDeviceTime(t) {
    if (!t) return '无记录';
    try {
      const d = new Date(t);
      if (isNaN(d.getTime())) return '无记录';
      return d.toLocaleString();
    } catch (e) {
      return '无记录';
    }
  }

  function renderDeviceList(payload) {
    if (!deviceListEl) return;
    const devices = Array.isArray(payload.devices) ? payload.devices : [];
    if (devices.length === 0) {
      deviceListEl.innerHTML = '<div class="device-list-empty">' + escapeHtml(I18N[currentLang].deviceListEmpty || '激活后可查看设备列表') + '</div>';
    } else {
      deviceListEl.innerHTML = devices.map(d => {
        const isCurrent = !!d.isCurrent;
        const isActive = !!d.isActive;
        const stateClass = isCurrent ? 'current' : (isActive ? '' : 'inactive');
        const badge = isCurrent
          ? '<span class="device-card-badge current">当前使用</span>'
          : (isActive ? '' : '<span class="device-card-badge inactive">已解绑</span>');
        const name = d.name ? escapeHtml(String(d.name).substring(0, 80)) : '未命名设备';
        const fp = escapeHtml(d.fingerprint || '--------');
        const lastIp = d.lastIp ? escapeHtml(d.lastIp) : '-';
        const lastSeen = escapeHtml(formatDeviceTime(d.lastSeen));
        const firstSeen = escapeHtml(formatDeviceTime(d.firstSeen));
        const unbindDisabled = isCurrent || !isActive ? 'disabled' : '';
        const unbindBtn = isActive
          ? `<button class="device-card-unbind" ${unbindDisabled} data-device-id="${escapeHtml(d.id)}" data-device-name="${escapeHtml(name)}">${isCurrent ? '当前设备' : '解绑'}</button>`
          : '';
        return `
          <div class="device-card ${stateClass}">
            <div class="device-card-info">
              <div class="device-card-name">${name} ${badge}</div>
              <div class="device-card-meta">
                <span>指纹：${fp}</span>
                <span>首次激活：${firstSeen}</span>
                <span>最后活跃：${lastSeen}</span>
                <span>IP：${lastIp}</span>
              </div>
            </div>
            ${unbindBtn}
          </div>
        `;
      }).join('');
      // 绑定解绑按钮
      deviceListEl.querySelectorAll('.device-card-unbind:not(:disabled)').forEach(btn => {
        btn.addEventListener('click', async () => {
          const deviceId = parseInt(btn.getAttribute('data-device-id'), 10);
          const deviceName = btn.getAttribute('data-device-name') || '该设备';
          if (!confirm(`确定要解绑「${deviceName}」吗？\n解绑后该设备将无法继续使用本激活码。\n此操作不会消耗换绑次数。`)) return;
          btn.disabled = true;
          const originalText = btn.textContent;
          btn.textContent = '解绑中...';
          try {
            const resp = await chrome.runtime.sendMessage({ action: 'unbindDevice', deviceId });
            if (resp && resp.success) {
              showToast(resp.message || '设备已解绑');
              await loadDevices();
            } else {
              showToast((resp && resp.error) || '解绑失败');
              btn.disabled = false;
              btn.textContent = originalText;
            }
          } catch (e) {
            showToast(e.message || '解绑失败');
            btn.disabled = false;
            btn.textContent = originalText;
          }
        });
      });
    }
    if (deviceSlotsValueEl) {
      const activeCount = devices.filter(d => d.isActive).length;
      deviceSlotsValueEl.textContent = `${activeCount} / ${payload.maxDevices || 2}`;
    }
    if (deviceRebindValueEl) {
      deviceRebindValueEl.textContent = String(payload.remainingRebind !== undefined ? payload.remainingRebind : '-');
    }
    if (deviceRebindPausedWarnEl) {
      if (payload.rebindPaused) {
        deviceRebindPausedWarnEl.textContent = '换绑功能已被风控暂停（异常换绑行为触发），暂停期间无法在新设备激活。';
        deviceRebindPausedWarnEl.classList.remove('hidden');
      } else {
        deviceRebindPausedWarnEl.classList.add('hidden');
      }
    }
  }

  async function loadDevices() {
    if (!deviceListEl) return;
    const { licenseType } = await chrome.storage.sync.get(['licenseType']);
    const { licenseCode } = await chrome.storage.local.get(['licenseCode']);
    if (!licenseCode || licenseType === 'free') {
      deviceListEl.innerHTML = '<div class="device-list-empty">' + escapeHtml(I18N[currentLang].deviceListEmpty || '激活后可查看设备列表') + '</div>';
      if (deviceSlotsValueEl) deviceSlotsValueEl.textContent = '-';
      if (deviceRebindValueEl) deviceRebindValueEl.textContent = '-';
      if (deviceRebindPausedWarnEl) deviceRebindPausedWarnEl.classList.add('hidden');
      return;
    }
    deviceListEl.innerHTML = '<div class="device-list-empty">加载中...</div>';
    try {
      const resp = await chrome.runtime.sendMessage({ action: 'getDevices' });
      if (resp && resp.success) {
        renderDeviceList(resp);
      } else {
        deviceListEl.innerHTML = '<div class="device-list-empty">' + escapeHtml((resp && resp.error) || '查询失败') + '</div>';
      }
    } catch (e) {
      deviceListEl.innerHTML = '<div class="device-list-empty">' + escapeHtml(e.message || '查询失败') + '</div>';
    }
  }

  if (refreshDevicesBtn) {
    refreshDevicesBtn.addEventListener('click', () => {
      loadDevices();
    });
  }

  // 当切换到账户 tab 或激活成功后刷新设备列表
  async function refreshDevicesIfActive() {
    const accountTab = document.getElementById('tab-account');
    if (accountTab && accountTab.classList.contains('active')) {
      await loadDevices();
    }
  }

  // 初次加载：若已在账户 tab，自动拉取
  (async () => {
    try {
      await loadDevices();
    } catch (e) { /* ignore */ }
  })();

  // 暴露给激活成功后调用
  window.__refreshDevices = loadDevices;

  // Upgrade button
  const upgradeModal = document.getElementById('upgradeModal');
  const closeUpgradeModal = document.getElementById('closeUpgradeModal');

  if (upgradeBtn) {
    upgradeBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: UPGRADE_URL });
    });
  }

  if (closeUpgradeModal) {
    closeUpgradeModal.addEventListener('click', () => { if (upgradeModal) closeModal(upgradeModal); });
  }
  if (upgradeModal) {
    upgradeModal.addEventListener('click', (e) => { if (e.target === upgradeModal) closeModal(upgradeModal); });
  }

  // Dead button fix: "I have an activation code" button
  const useActivationCodeBtn = document.getElementById('useActivationCodeBtn') || document.getElementById('upgradeOptionCode');
  if (useActivationCodeBtn) {
    useActivationCodeBtn.addEventListener('click', () => {
      if (upgradeModal) closeModal(upgradeModal);
      switchTab('account');
      setTimeout(() => {
        if (activationCodeInput) activationCodeInput.focus();
      }, 100);
    });
  }

  // Free tier notification
  const freeTierNotification = document.getElementById('freeTierNotification');
  const quotaRemaining = document.getElementById('quotaRemaining');
  const freeTierUpgradeBtn = document.getElementById('freeTierUpgradeBtn');

  function updateFreeTierNotification() {
    chrome.storage.sync.get(['licenseType'], (syncData) => {
      if (chrome.runtime.lastError) {
        console.error('Storage error:', chrome.runtime.lastError);
        return;
      }
      const licenseType = syncData.licenseType || 'free';
      if (licenseType !== 'free') {
        if (freeTierNotification) freeTierNotification.classList.remove('show');
        return;
      }
      chrome.storage.local.get(['dailyReplyCount', 'lastResetDate'], (usageData) => {
        if (chrome.runtime.lastError) {
          console.error('Storage error:', chrome.runtime.lastError);
          return;
        }
        const today = new Date().toISOString().split('T')[0];
        const effectiveCount = usageData.lastResetDate === today ? (usageData.dailyReplyCount || 0) : 0;
        const remaining = Math.max(0, DAILY_LIMIT - effectiveCount);
        if (remaining <= 5) {
          if (freeTierNotification) {
            freeTierNotification.classList.add('show');
            if (quotaRemaining) quotaRemaining.textContent = remaining;
          }
        } else {
          if (freeTierNotification) freeTierNotification.classList.remove('show');
        }
      });
    });
  }

  if (freeTierUpgradeBtn) {
    freeTierUpgradeBtn.addEventListener('click', () => { chrome.tabs.create({ url: UPGRADE_URL }); });
  }

  // 免费额度通知条 dismiss 按钮（当前会话隐藏，不持久化）
  const freeTierDismissBtn = document.getElementById('freeTierDismissBtn');
  if (freeTierDismissBtn) {
    freeTierDismissBtn.addEventListener('click', () => {
      if (freeTierNotification) freeTierNotification.classList.remove('show');
    });
  }

  // ---- Data Backup ----
  const exportAllSettingsBtn = document.getElementById('exportAllSettingsBtn');
  const importAllSettingsBtn = document.getElementById('importAllSettingsBtn');
  const allSettingsFileInput = document.getElementById('allSettingsFileInput');

  if (exportAllSettingsBtn) {
    exportAllSettingsBtn.addEventListener('click', () => {
      chrome.storage.sync.get(null, (data) => {
        if (chrome.runtime.lastError) {
          console.error('Storage error:', chrome.runtime.lastError);
          showToast(I18N[currentLang].exportSettingsNone || 'No settings to export', true);
          return;
        }
        // licenseCode 已迁移至 local，需单独读取
        chrome.storage.local.get(['licenseCode', 'apiUrl', 'apiKey', 'modelName'], (localData) => {
        const settings = {
          personas: data.personas || [],
          activePersonaId: data.activePersonaId,
          tone: data.tone,
          replyLength: data.replyLength,
          faqData: data.faqData || [],
          btnTheme: data.btnTheme,
          generationMode: data.generationMode,
          shortcut: data.shortcut,
          apiUrl: localData.apiUrl || '',
          apiKey: localData.apiKey || '',
          modelName: localData.modelName || '',
          licenseType: data.licenseType,
          licenseCode: localData.licenseCode,
          activatedAt: data.activatedAt,
          exportDate: new Date().toISOString()
        };
          const dataStr = JSON.stringify(settings, null, 2);
          const blob = new Blob([dataStr], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'chatgenius-settings-' + new Date().toISOString().slice(0, 10) + '.json';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          showToast(I18N[currentLang].exportSettingsSuccess || 'Settings exported!');
        });
      });
    });
  }

  if (importAllSettingsBtn && allSettingsFileInput) {
    importAllSettingsBtn.addEventListener('click', () => allSettingsFileInput.click());

    function validateSettings(data) {
      if (typeof data !== 'object' || data === null) return false;

      if ('personas' in data) {
        if (!Array.isArray(data.personas)) return false;
        for (const p of data.personas) {
          if (typeof p !== 'object' || typeof p.id !== 'string' ||
              typeof p.name !== 'string' || typeof p.prompt !== 'string') return false;
        }
      }

      if ('faqData' in data) {
        if (!Array.isArray(data.faqData)) return false;
        for (const f of data.faqData) {
          if (typeof f !== 'object' || typeof f.q !== 'string' || typeof f.a !== 'string') return false;
        }
      }

      const stringFields = ['tone', 'replyLength', 'btnTheme', 'generationMode', 'shortcut', 'apiProvider', 'apiKey', 'apiUrl', 'modelName', 'licenseType', 'licenseCode'];
      for (const field of stringFields) {
        if (field in data && typeof data[field] !== 'string') return false;
      }

      return true;
    }

    allSettingsFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // File size validation (max 1MB)
      if (file.size > 1024 * 1024) {
        showToast(I18N[currentLang].importFileTooLarge || 'File too large (max 1MB)', true);
        allSettingsFileInput.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          if (!validateSettings(imported)) {
            showToast(I18N[currentLang].importInvalidData || 'Invalid data format', true);
            allSettingsFileInput.value = '';
            return;
          }
          const settingsToSave = {};
          const keys = ['personas', 'activePersonaId', 'tone', 'replyLength', 'faqData', 'btnTheme', 'generationMode', 'shortcut', 'licenseType', 'activatedAt'];
          keys.forEach(key => { if (imported[key] !== undefined) settingsToSave[key] = imported[key]; });

          chrome.storage.sync.set(settingsToSave, () => {
            if (chrome.runtime.lastError) {
              console.error('Import save error:', chrome.runtime.lastError);
              showToast(I18N[currentLang].importSettingsFail || 'Failed to import settings', true);
              return;
            }
            // licenseCode / apiUrl / apiKey / modelName 写入 local（与其他字段分离）
            const localFields = {};
            if (imported.licenseCode !== undefined) localFields.licenseCode = imported.licenseCode;
            if (imported.apiUrl !== undefined) localFields.apiUrl = imported.apiUrl;
            if (imported.apiKey !== undefined) localFields.apiKey = imported.apiKey;
            if (imported.modelName !== undefined) localFields.modelName = imported.modelName;
            if (imported.apiUrl !== undefined || imported.apiKey !== undefined) {
              localFields.apiProvider = 'custom';
              // 导入 API 配置后：更新指纹 + 清空旧连接状态（需重新测试）
              const importedFingerprint = (imported.apiUrl || '') + '|' + (imported.apiKey || '') + '|' + (imported.modelName || '');
              localFields.savedApiFingerprint = importedFingerprint;
              // 清空旧 connectionValid（导入的配置需重新测试连接）
              chrome.storage.sync.set({ connectionValid: null });
            }

            const finishImport = () => {
              // Reload state
              if (imported.personas) { personas = imported.personas; activePersonaId = imported.activePersonaId || (personas.length > 0 ? personas[0].id : null); }
              if (imported.faqData) faqData = imported.faqData;
              renderPersonas();
              renderFaq();
              updateLicenseDisplay(imported.licenseType || 'free');
              // 刷新自定义模型表单
              const apiUrlInputField = document.getElementById('apiUrlInput');
              const modelNameInputField = document.getElementById('modelNameInput');
              if (apiUrlInputField) apiUrlInputField.value = imported.apiUrl || '';
              if (modelNameInputField) modelNameInputField.value = imported.modelName || '';
              if (apiKeyInput) apiKeyInput.value = imported.apiKey || '';
              updateApiStatusBar();
              showToast(I18N[currentLang].importSettingsSuccess || 'Settings imported successfully!');
            };
            if (Object.keys(localFields).length > 0) {
              chrome.storage.local.set(localFields, finishImport);
            } else {
              finishImport();
            }
          });
        } catch (err) {
          showToast(I18N[currentLang].importSettingsFail || 'Failed to import settings', true);
        }
      };
      reader.readAsText(file);
      allSettingsFileInput.value = '';
    });
  }

  // ---- Stats Footer ----
  const statRepliesEl = document.getElementById('statReplies');
  const statSuccessEl = document.getElementById('statSuccess');
  const statQuotaEl = document.getElementById('statQuota');

  function updateStats() {
    chrome.storage.local.get({ totalReplies: 0, successCount: 0, failedCount: 0 }, (data) => {
      if (chrome.runtime.lastError) {
        console.error('Storage error:', chrome.runtime.lastError);
        return;
      }
      const replies = data.totalReplies || 0;
      const successCount = data.successCount || 0;
      const failedCount = data.failedCount || 0;
      if (statRepliesEl) statRepliesEl.textContent = replies.toLocaleString();
      if (statSuccessEl) {
        const total = successCount + failedCount;
        if (total > 0) {
          const rate = Math.round((successCount / total) * 100);
          statSuccessEl.textContent = rate + '%';
          statSuccessEl.setAttribute('data-tooltip', successCount + '/' + total + ' 次成功');
          statSuccessEl.style.color = rate >= 90 ? 'var(--success)' : rate >= 70 ? 'var(--warning)' : 'var(--error)';
        } else {
          statSuccessEl.textContent = '-';
          statSuccessEl.setAttribute('data-tooltip', '暂无数据');
          statSuccessEl.style.color = '';
        }
      }
    });

    chrome.storage.sync.get(['licenseType'], (licenseData) => {
      if (chrome.runtime.lastError) {
        console.error('Storage error:', chrome.runtime.lastError);
        return;
      }
      const licenseType = licenseData.licenseType || 'free';
      if (licenseType === 'free') {
        chrome.storage.local.get(['dailyReplyCount', 'lastResetDate'], (usageData) => {
          if (chrome.runtime.lastError) {
            console.error('Storage error:', chrome.runtime.lastError);
            return;
          }
          const today = new Date().toISOString().split('T')[0];
          const effectiveCount = usageData.lastResetDate === today ? (usageData.dailyReplyCount || 0) : 0;
          if (statQuotaEl) statQuotaEl.textContent = effectiveCount + '/' + DAILY_LIMIT;
        });
      } else {
        if (statQuotaEl) statQuotaEl.textContent = I18N[currentLang]['statPro' + (licenseType === 'lifetime' ? 'Lifetime' : 'Year')] || licenseType;
      }
    });
  }

  // ---- API Key Storage Migration (sync → local) ----
  function migrateApiKeyToLocal() {
    chrome.storage.sync.get(['apiKey', 'apiProvider'], (syncData) => {
      if (chrome.runtime.lastError) { console.error(chrome.runtime.lastError); return; }
      chrome.storage.local.get(['apiKey', 'apiProvider'], (localData) => {
        if (chrome.runtime.lastError) { console.error(chrome.runtime.lastError); return; }
        if (syncData.apiKey && !localData.apiKey) {
          const toMigrate = {};
          if (syncData.apiKey) toMigrate.apiKey = syncData.apiKey;
          if (syncData.apiProvider) toMigrate.apiProvider = syncData.apiProvider;
          chrome.storage.local.set(toMigrate, () => {
            chrome.storage.sync.remove('apiKey', () => {});
          });
        } else if (syncData.apiKey && localData.apiKey) {
          // Local already has key, clean up sync
          chrome.storage.sync.remove('apiKey', () => {});
        }
      });
    });
  }

  // ---- License Code Storage Migration (sync → local) ----
  function migrateLicenseCodeToLocal() {
    chrome.storage.sync.get(['licenseCode'], (syncData) => {
      if (chrome.runtime.lastError) { console.error(chrome.runtime.lastError); return; }
      if (!syncData.licenseCode) return;
      chrome.storage.local.get(['licenseCode'], (localData) => {
        if (chrome.runtime.lastError) { console.error(chrome.runtime.lastError); return; }
        if (!localData.licenseCode) {
          chrome.storage.local.set({ licenseCode: syncData.licenseCode }, () => {
            chrome.storage.sync.remove('licenseCode', () => {});
          });
        } else {
          chrome.storage.sync.remove('licenseCode', () => {});
        }
      });
    });
  }

  // ---- API Status Bar - 顶部 API 状态提醒 ----
  const apiStatusBar = document.getElementById('apiStatusBar');
  const apiStatusIconEl = document.getElementById('apiStatusIcon');
  const apiStatusTextEl = document.getElementById('apiStatusBarText');
  const apiStatusTestBtn = document.getElementById('apiStatusTestBtn');
  const apiStatusConfigBtn = document.getElementById('apiStatusConfigBtn');

  // SVG 图标定义
  const STATUS_ICONS = {
    warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
    testing: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>'
  };

  function setApiStatusBarState(state, text, iconKey) {
    if (!apiStatusBar) return;
    apiStatusBar.className = 'api-status-bar ' + state;
    apiStatusBar.style.display = 'flex';
    if (apiStatusTextEl && text) apiStatusTextEl.textContent = text;
    if (apiStatusIconEl && iconKey && STATUS_ICONS[iconKey]) {
      apiStatusIconEl.innerHTML = STATUS_ICONS[iconKey];
    }
    // 按钮显示控制
    if (apiStatusTestBtn) {
      apiStatusTestBtn.style.display = (state === 'connected' || state === 'failed') ? '' : 'none';
    }
    if (apiStatusConfigBtn) {
      apiStatusConfigBtn.style.display = (state === 'unconfigured') ? '' : 'none';
    }
  }

  function updateApiStatusBar() {
    if (!apiStatusBar) return;
    chrome.storage.local.get(['apiKey', 'apiUrl', 'modelName'], (data) => {
      if (chrome.runtime.lastError) return;
      const hasApiKey = !!data.apiKey;
      const hasUrl = !!data.apiUrl;
      const zh = currentLang === 'zh';

      if (!hasApiKey || !hasUrl) {
        // 未配置或配置不完整：显示警告 + 去配置按钮
        const msg = (!hasUrl && !hasApiKey)
          ? (zh ? '尚未配置大模型 API，请填写地址、Key 和模型名' : 'AI model API not configured. Please fill URL, Key and model.')
          : (zh ? 'API 配置不完整，请填写地址、Key 和模型名' : 'API config incomplete. Please fill URL, Key and model.');
        setApiStatusBarState('unconfigured', msg, 'warning');
        if (apiStatusIconEl) apiStatusIconEl.style.color = 'var(--warning)';
      } else {
        // 已配置：读取上次连接状态
        chrome.storage.sync.get(['connectionValid'], (syncData) => {
          const label = data.modelName || 'API';
          if (syncData.connectionValid === true) {
            setApiStatusBarState('connected',
              (zh ? '已连接 · ' : 'Connected · ') + label,
              'success');
            if (apiStatusIconEl) apiStatusIconEl.style.color = 'var(--success)';
            // 已测试通过：隐藏 API 指南 banner
            const banner = document.getElementById('apiGuideBanner');
            if (banner) banner.classList.add('hidden');
          } else if (syncData.connectionValid === false) {
            setApiStatusBarState('failed',
              (zh ? '连接失败 · ' : 'Connection failed · ') + label,
              'error');
            if (apiStatusIconEl) apiStatusIconEl.style.color = 'var(--error)';
          } else {
            // 已配置但未测试过，仅显示"已配置"
            setApiStatusBarState('testing',
              zh ? '已配置' : 'Configured',
              'testing');
            if (apiStatusIconEl) apiStatusIconEl.style.color = 'var(--accent)';
          }
        });
      }
    });
  }

  // 测试连接按钮（状态栏）
  if (apiStatusTestBtn) {
    apiStatusTestBtn.addEventListener('click', async () => {
      const data = await chrome.storage.local.get(['apiKey', 'apiUrl', 'modelName']);
      if (!data.apiKey || !data.apiUrl) return;
      const zh = currentLang === 'zh';
      setApiStatusBarState('testing', zh ? '正在测试连接...' : 'Testing connection...', 'testing');
      if (apiStatusIconEl) apiStatusIconEl.style.color = 'var(--accent)';
      // 复用自定义测试逻辑，传空 resultEl（状态栏自己更新）
      await doTestConnectionCustom(data.apiUrl, data.apiKey, data.modelName, null, null);
      // 测试完成后刷新状态栏
      updateApiStatusBar();
    });
  }

  // 去配置按钮（状态栏）
  if (apiStatusConfigBtn) {
    apiStatusConfigBtn.addEventListener('click', () => {
      switchTab('api');
      // 滚动到自定义模型表单
      const apiForm = document.querySelector('.custom-api-form');
      if (apiForm) {
        apiForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

  // ---- Load Settings ----
  function loadSettings() {
    migrateApiKeyToLocal();
    migrateLicenseCodeToLocal();
    chrome.storage.local.get({ apiKey: '', apiProvider: 'openai', apiUrl: '', modelName: '', licenseCode: null }, (localData) => {
      chrome.storage.sync.get({
        personas: [{ id: 'default', name: '默认角色 (Default)', prompt: '你是一个专业的AI助手。请根据用户的消息上下文进行专业、礼貌的回复。' }],
        activePersonaId: 'default',
        shortcut: 'Alt + 1',
        tone: 'auto',
        replyLength: 'auto',
        faqData: [],
        btnTheme: 'gradient',
        generationMode: 'auto',
        lang: 'zh',
        licenseType: 'free',
        activatedAt: null
      }, (data) => {
        if (chrome.runtime.lastError) {
          console.error('Load settings error:', chrome.runtime.lastError);
        }
        currentLang = data.lang || 'zh';
        applyI18n();

        personas = data.personas || [];
        activePersonaId = data.activePersonaId;
        if (personas.length > 0 && !activePersonaId) activePersonaId = personas[0].id;
        faqData = data.faqData || [];

        // Set form values
        const toneSelect = document.getElementById('tone');
        const replyLengthSelect = document.getElementById('replyLength');
        if (toneSelect) toneSelect.value = data.tone || 'auto';
        if (replyLengthSelect) replyLengthSelect.value = data.replyLength || 'auto';
        if (btnThemeSelect) btnThemeSelect.value = data.btnTheme || 'gradient';
        // 初始化主题预览
        updateThemePreview(data.btnTheme || 'gradient');
        // 回填生成模式
        const genModeSelect = document.getElementById('generationMode');
        if (genModeSelect) genModeSelect.value = data.generationMode || 'auto';

        // 回填快捷键录入按钮显示
        if (shortcutRecorder) shortcutRecorder.textContent = data.shortcut || '未设置';
        if (shortcutInput) shortcutInput.value = data.shortcut || 'Alt + 1';

        // 加载 models-config.json（保留兼容），异步拉取远程推荐配置
        loadApiProviders().then(() => {
          fetchRemoteProviderConfig();
        });

        // 填充自定义模型表单（URL / Key / 模型名 —— 用户直接配置）
        const apiUrlInputField = document.getElementById('apiUrlInput');
        const modelNameInputField = document.getElementById('modelNameInput');
        if (apiUrlInputField) apiUrlInputField.value = localData.apiUrl || '';
        if (modelNameInputField) modelNameInputField.value = localData.modelName || '';
        if (apiKeyInput) apiKeyInput.value = localData.apiKey || '';

        // Add change listeners for auto-save
        [toneSelect, replyLengthSelect, btnThemeSelect].forEach(el => {
          if (el) el.addEventListener('change', () => scheduleSave());
        });

        renderPersonas();
        renderFaq();
        updateLicenseDisplay(data.licenseType || 'free');

        // Check existing license（licenseCode 从 local 读取）
        if (localData.licenseCode && data.licenseType && data.licenseType !== 'free') {
          if (activationSuccess) activationSuccess.style.display = 'flex';
          if (licenseTypeDisplay) {
            const typeNames = { 'lifetime': I18N[currentLang].statProLifetime, 'year': I18N[currentLang].statProYear };
            licenseTypeDisplay.textContent = typeNames[data.licenseType] || data.licenseType;
          }
        }

        updateStats();
        updateFreeTierNotification();

        // 移除骨架屏，显示真实内容
        const skeleton = document.getElementById('skeletonScreen');
        const container = document.querySelector('.page-container');
        if (skeleton) skeleton.classList.add('hidden');
        if (container) container.classList.add('loaded');

        updateApiStatusBar();
      });
    });
  }

  loadSettings();

  // Refresh stats periodically
  let statsIntervalId = null;
  let notificationIntervalId = null;

  function startIntervals() {
    if (!statsIntervalId) statsIntervalId = setInterval(updateStats, 30000);
    if (!notificationIntervalId) notificationIntervalId = setInterval(updateFreeTierNotification, 60000);
  }

  function stopIntervals() {
    if (statsIntervalId) { clearInterval(statsIntervalId); statsIntervalId = null; }
    if (notificationIntervalId) { clearInterval(notificationIntervalId); notificationIntervalId = null; }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopIntervals();
    } else {
      startIntervals();
    }
  });

  startIntervals();
});
