import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'ChatGenius AI 文档',
  description: 'ChatGenius AI 配置指南 — AI 自动回复助手 API 接入文档',
  lang: 'zh-CN',
  base: '/docs/',

  head: [
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', { href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap', rel: 'stylesheet' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:locale', content: 'zh-CN' }],
    ['meta', { name: 'og:site_name', content: 'ChatGenius AI 文档' }],
  ],

  themeConfig: {
    logo: { src: '/icons/icon48.png', width: 28, height: 28 },

    nav: [
      { text: '文档首页', link: '/' },
      { text: '快速开始', link: '/guide/getting-started' },
      { text: '服务商', link: '/providers/' },
      { text: '官网', link: 'https://chat.sopie.cc' },
    ],

    sidebar: [
      {
        text: '快速开始',
        items: [
          { text: '3 分钟上手', link: '/guide/getting-started' },
          { text: '选择服务商', link: '/guide/choosing-a-provider' },
          { text: '通用配置步骤', link: '/guide/common-steps' },
        ],
      },
      {
        text: '国内服务商',
        items: [
          { text: 'DeepSeek', link: '/providers/deepseek' },
          { text: '通义千问', link: '/providers/qwen' },
          { text: '智谱清言', link: '/providers/zhipu' },
          { text: '豆包', link: '/providers/doubao' },
          { text: 'Moonshot', link: '/providers/moonshot' },
          { text: '百川大模型', link: '/providers/baichuan' },
          { text: '零一万物', link: '/providers/yi' },
          { text: 'MiniMax', link: '/providers/minimax' },
          { text: '阶跃星辰', link: '/providers/stepfun' },
        ],
      },
      {
        text: '国际服务商',
        items: [
          { text: 'OpenAI', link: '/providers/openai' },
          { text: 'Anthropic', link: '/providers/anthropic' },
          { text: 'Google AI', link: '/providers/google' },
          { text: 'OpenRouter', link: '/providers/openrouter' },
        ],
      },
      {
        text: '帮助与支持',
        items: [
          { text: '常见问题', link: '/faq/' },
          { text: '安全与隐私', link: '/security' },
          { text: '联系我们', link: '/contact' },
        ],
      },
    ],

    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索',
            buttonAriaLabel: '搜索',
          },
          modal: {
            displayDetails: '显示详情',
            resetButtonTitle: '重置',
            backButtonTitle: '返回',
            noResultsText: '没有结果',
            footer: {
              selectText: '选择',
              navigateText: '导航',
              closeText: '关闭',
            },
          },
        },
      },
    },

    darkModeSwitchLabel: '主题',
    darkModeSwitchTitle: '切换到暗色模式',
    lightModeSwitchTitle: '切换到亮色模式',
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',

    outline: {
      label: '本页目录',
      level: [2, 3],
    },

    docFooter: {
      prev: '上一篇',
      next: '下一篇',
    },

    lastUpdated: {
      text: '最后更新于',
    },

    footer: {
      message: 'ChatGenius AI — 智能自动回复助手',
      copyright: '© 2026 ChatGenius AI. All rights reserved.',
    },
  },
})
