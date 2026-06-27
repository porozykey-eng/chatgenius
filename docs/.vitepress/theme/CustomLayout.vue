<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useData, useRoute } from 'vitepress'
import DefaultTheme from 'vitepress/theme'

const { Layout } = DefaultTheme
const { page, frontmatter, site } = useData()
const route = useRoute()

// --- Breadcrumb ---
const breadcrumb = computed(() => {
  const path = route.path.replace(/\/docs\//, '/').replace(/\.html$/, '').replace(/\/$/, '')
  const segments = path.split('/').filter(Boolean)
  if (segments.length <= 1) return []

  const crumbs: { text: string; link?: string }[] = []
  const nameMap: Record<string, string> = {
    guide: '快速开始',
    providers: '服务商',
    faq: '常见问题',
    'getting-started': '3 分钟上手',
    'choosing-a-provider': '选择服务商',
    'common-steps': '通用配置步骤',
    deepseek: 'DeepSeek',
    qwen: '通义千问',
    zhipu: '智谱清言',
    doubao: '豆包',
    moonshot: 'Moonshot',
    baichuan: '百川大模型',
    yi: '零一万物',
    minimax: 'MiniMax',
    stepfun: '阶跃星辰',
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    google: 'Google AI',
    openrouter: 'OpenRouter',
    security: '安全与隐私',
    contact: '联系我们',
    index: '总览',
  }

  let currentPath = '/docs/'
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    currentPath += seg + '/'
    const text = nameMap[seg] || seg
    const isLast = i === segments.length - 1
    crumbs.push({
      text,
      link: isLast ? undefined : currentPath,
    })
  }

  return crumbs
})

// --- Page Feedback ---
const feedbackState = ref<'idle' | 'yes' | 'no'>('idle')

function handleFeedback(type: 'yes' | 'no') {
  feedbackState.value = type
}

// Reset feedback on page change
watch(() => route.path, () => {
  feedbackState.value = 'idle'
})

// Only show breadcrumb/feedback on doc pages (not home)
const isDocPage = computed(() => {
  return frontmatter.value.layout !== 'home' && route.path !== '/docs/' && route.path !== '/docs/index.html'
})
</script>

<template>
  <Layout>
    <template #doc-before>
      <div v-if="isDocPage && breadcrumb.length > 0" class="cg-breadcrumb">
        <a href="/docs/">文档</a>
        <template v-for="(crumb, index) in breadcrumb" :key="index">
          <span class="separator">›</span>
          <a v-if="crumb.link" :href="crumb.link">{{ crumb.text }}</a>
          <span v-else class="current">{{ crumb.text }}</span>
        </template>
      </div>
    </template>

    <template #doc-footer-before>
      <div v-if="isDocPage" class="cg-feedback">
        <div class="cg-feedback-title">此页面是否有帮助？</div>
        <div v-if="feedbackState === 'idle'" class="cg-feedback-buttons">
          <button class="cg-feedback-btn" @click="handleFeedback('yes')">
            <span>👍</span> 有帮助
          </button>
          <button class="cg-feedback-btn" @click="handleFeedback('no')">
            <span>👎</span> 需要改进
          </button>
        </div>
        <div v-else class="cg-feedback-thanks">
          感谢你的反馈！
        </div>
      </div>
    </template>
  </Layout>
</template>
