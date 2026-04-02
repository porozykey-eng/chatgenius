const I18N = {
  en: {
    title: 'AI Auto-Reply | Elite Guide',
    navTitle: 'AI AUTO-REPLY',
    navLabelGuide: 'Navigation',
    sec1Title: 'Configuration',
    sec2Title: 'Personas',
    sec3Title: 'Experience',
    navLabelAdvanced: 'System',
    sec4Title: 'Pro Intelligence',
    navChangelog: 'Timeline',
    badgeText: 'SYSTEM VERSION 1.9.0',
    heroTitle: 'Master the Art of AI Communication',
    heroDesc: 'Elevate your digital presence with sophisticated AI automation. Seamlessly integrated, ethically designed, and built for the modern professional.',
    sec1L1Title: 'Access Interface',
    sec1L1: 'Initialize the system by selecting the extension icon in your secure browser environment.',
    sec1L2Title: 'Intelligence Provider',
    sec1L2: 'Select your preferred neural engine (OpenAI, DeepSeek, or Gemini) to power your conversations.',
    sec1L4Title: 'Secure Authentication',
    sec1L4: 'Input your encrypted API credentials. Your data remains local, private, and under your control.',
    sec2P1: 'Tailored Identity',
    sec2PromptGuide: 'Define the exact tone, expertise, and behavioral boundaries of your AI. Whether it's a high-stakes sales closer or a empathetic support lead, the choice is yours.',
    sec2L4Title: 'Naming',
    sec2L4: 'Assign unique identifiers to your personas for rapid switching in real-time environments.',
    sec3L2Title: 'Floating Interface',
    sec3L2: 'A non-intrusive, elegant trigger that appears exactly when you need it within your chat workflow.',
    sec3L3Title: 'Command Shortcuts',
    sec3L3: 'Execute complex AI generations with a single keystroke (Alt + 1), designed for maximum efficiency.',
    sec3L4Title: 'Contextual Typing',
    sec3L4: 'The system analyzes conversation history to generate responses that feel human, relevant, and precise.',
    sec4L1Title: 'Knowledge Synthesis',
    sec4L1: 'Upload your proprietary FAQ or documentation. The AI synthesizes this data to provide hyper-accurate, brand-consistent answers.',
    sec4L2Title: 'Infinite Scaling',
    sec4L2: 'Unlock unlimited personas and advanced model parameters for complex business logic.',
    v190Date: 'MAR 2026',
    v190Title: 'v1.9.0 — Intelligence & Branding',
    v190Desc: 'Official AI provider branding, SVG icons, and custom provider support.',
    footerText: '© 2026 AI AUTO-REPLY ELITE. ALL RIGHTS RESERVED.'
  },
  zh: {
    title: 'AI 自动回复 | 尊享指南',
    navTitle: 'AI 自动回复',
    navLabelGuide: '导航',
    sec1Title: '核心配置',
    sec2Title: '数字人设',
    sec3Title: '无缝体验',
    navLabelAdvanced: '系统',
    sec4Title: '专业智能',
    navChangelog: '更新日志',
    badgeText: '系统版本 1.9.0',
    heroTitle: '掌握 AI 通讯的艺术',
    heroDesc: '通过先进的 AI 自动化提升您的数字化存在感。无缝集成、合乎伦理的设计，专为现代专业人士打造。',
    sec1L1Title: '访问界面',
    sec1L1: '通过在安全的浏览器环境中选择扩展图标来初始化系统。',
    sec1L2Title: '智能提供商',
    sec1L2: '选择您偏好的神经引擎（OpenAI、DeepSeek 或 Gemini）来驱动您的对话。',
    sec1L4Title: '安全身份验证',
    sec1L4: '输入您的加密 API 凭据。您的数据保持本地化、私密且受您控制。',
    sec2P1: '量身定制的身份',
    sec2PromptGuide: '定义 AI 的确切语气、专业知识和行为边界。无论是高风险的销售达成者还是富有同情心的支持主管，选择权都在您手中。',
    sec2L4Title: '命名',
    sec2L4: '为您的角色分配唯一标识符，以便在实时环境中快速切换。',
    sec3L2Title: '悬浮界面',
    sec3L2: '一个非侵入性、优雅的触发器，在您的聊天工作流程中恰到好处地出现。',
    sec3L3Title: '命令快捷键',
    sec3L3: '通过单次按键（Alt + 1）执行复杂的 AI 生成，专为最高效率而设计。',
    sec3L4Title: '上下文打字',
    sec3L4: '系统分析对话历史记录，生成感觉真实、相关且精确的回复。',
    sec4L1Title: '知识合成',
    sec4L1: '上传您的专有 FAQ 或文档。AI 合成这些数据以提供高度准确、品牌一致的答案。',
    sec4L2Title: '无限扩展',
    sec4L2: '解锁无限角色和高级模型参数，以处理复杂的业务逻辑。',
    v190Date: '2026年3月',
    v190Title: 'v1.9.0 — 智能与品牌',
    v190Desc: '官方 AI 提供商品牌、SVG 图标以及自定义提供商支持。',
    footerText: '© 2026 AI 自动回复尊享版。保留所有权利。'
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const langToggle = document.getElementById('langToggle');
  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.section');
  
  let currentLang = 'zh';

  chrome.storage.sync.get({ lang: 'zh' }, (data) => {
    currentLang = data.lang;
    applyI18n();
  });

  langToggle.addEventListener('click', () => {
    currentLang = currentLang === 'zh' ? 'en' : 'zh';
    chrome.storage.sync.set({ lang: currentLang });
    applyI18n();
  });

  function applyI18n() {
    document.documentElement.lang = currentLang === 'zh' ? 'zh-CN' : 'en';
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (I18N[currentLang][key]) {
        el.innerHTML = I18N[currentLang][key];
      }
    });
  }

  // Scroll Spy & Entrance Animations
  const observerOptions = {
    threshold: 0.2,
    rootMargin: '0px 0px -10% 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        const id = entry.target.getAttribute('id');
        navItems.forEach(item => {
          item.classList.toggle('active', item.getAttribute('href') === '#' + id);
        });
      }
    });
  }, observerOptions);

  sections.forEach(section => observer.observe(section));
});