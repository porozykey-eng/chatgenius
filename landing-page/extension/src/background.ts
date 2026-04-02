/**
 * ChatGenius AI - 扩展后台脚本
 * 处理AI回复请求，强制执行使用限制
 */

import { getUsageLimiter, DAILY_FREE_LIMIT } from './core/UsageLimiter'

// 初始化限制器
const limiter = getUsageLimiter()

// ==================== 消息处理 ====================
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender, sendResponse)
  return true // 保持消息通道开启
})

async function handleMessage(
  message: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
) {
  try {
    switch (message.action) {
      case 'checkUsage':
        await handleCheckUsage(sendResponse)
        break
        
      case 'recordUsage':
        await handleRecordUsage(sendResponse)
        break
        
      case 'getQuota':
        await handleGetQuota(sendResponse)
        break
        
      case 'activateLicense':
        await handleActivateLicense(message.code, sendResponse)
        break
        
      case 'getLicenseInfo':
        await handleGetLicenseInfo(sendResponse)
        break
        
      case 'generateReply':
        await handleGenerateReply(message, sendResponse)
        break
        
      default:
        sendResponse({ success: false, error: 'Unknown action' })
    }
  } catch (error) {
    sendResponse({ success: false, error: String(error) })
  }
}

// ==================== 处理函数 ====================

async function handleCheckUsage(sendResponse: (response: any) => void) {
  const result = await limiter.canUse()
  
  sendResponse({
    success: true,
    allowed: result.allowed,
    reason: result.reason,
    remaining: result.remaining,
    limit: DAILY_FREE_LIMIT.value,
  })
}

async function handleRecordUsage(sendResponse: (response: any) => void) {
  await limiter.recordUsage()
  
  sendResponse({
    success: true,
    remaining: limiter.getRemainingQuota(),
  })
}

async function handleGetQuota(sendResponse: (response: any) => void) {
  const remaining = limiter.getRemainingQuota()
  const isPro = limiter.isProUser()
  
  sendResponse({
    success: true,
    isPro,
    remaining,
    limit: DAILY_FREE_LIMIT.value,
    unlimited: isPro,
  })
}

async function handleActivateLicense(code: string, sendResponse: (response: any) => void) {
  const result = await limiter.activateLicense(code)
  
  sendResponse({
    success: result.success,
    message: result.message,
  })
}

async function handleGetLicenseInfo(sendResponse: (response: any) => void) {
  const isPro = limiter.isProUser()
  
  sendResponse({
    success: true,
    isPro,
    // 不返回敏感信息
  })
}

async function handleGenerateReply(message: any, sendResponse: (response: any) => void) {
  // 1. 检查使用权限
  const usageCheck = await limiter.canUse()
  
  if (!usageCheck.allowed) {
    sendResponse({
      success: false,
      error: usageCheck.reason,
      remaining: 0,
      limit: DAILY_FREE_LIMIT.value,
      upgradeRequired: true,
    })
    return
  }
  
  try {
    // 2. 调用AI生成回复
    const reply = await generateAIReply(message.context, message.options)
    
    // 3. 记录使用（只有成功时才记录）
    await limiter.recordUsage()
    
    sendResponse({
      success: true,
      reply,
      remaining: limiter.getRemainingQuota(),
    })
  } catch (error) {
    sendResponse({
      success: false,
      error: 'AI生成失败: ' + String(error),
    })
  }
}

// ==================== AI回复生成 ====================

async function generateAIReply(context: any, options: any): Promise<string> {
  // 从storage获取API配置
  const config = await getAPIConfig()
  
  if (!config.apiKey || !config.apiEndpoint) {
    throw new Error('请先配置API Key')
  }
  
  const response = await fetch(config.apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model || 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: getSystemPrompt(options),
        },
        {
          role: 'user',
          content: context.lastMessage || '',
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    }),
  })
  
  if (!response.ok) {
    throw new Error(`API请求失败: ${response.status}`)
  }
  
  const data = await response.json()
  return data.choices[0]?.message?.content || ''
}

function getSystemPrompt(options: any): string {
  const role = options.role || 'professional'
  const tone = options.tone || 'friendly'
  const language = options.language || 'auto'
  
  return `You are a professional messaging assistant. Generate a reply that is:
- ${role === 'professional' ? 'Professional and business-like' : 'Casual and friendly'}
- ${tone === 'friendly' ? 'Warm and approachable' : tone === 'formal' ? 'Formal and polite' : 'Balanced'}
- In ${language === 'auto' ? 'the same language as the incoming message' : language}
- Concise but complete (2-4 sentences max)
- Helpful and addresses the user's needs

Context: ${options.context || 'General messaging'}

Generate only the reply text, no explanations.`
}

async function getAPIConfig(): Promise<{
  apiKey: string
  apiEndpoint: string
  model: string
}> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['apiKey', 'apiEndpoint', 'model'], (result) => {
      resolve({
        apiKey: result.apiKey || '',
        apiEndpoint: result.apiEndpoint || 'https://api.deepseek.com/v1/chat/completions',
        model: result.model || 'deepseek-chat',
      })
    })
  })
}

// ==================== 扩展安装/更新处理 ====================

chrome.runtime.onInstalled.addListener(async (details) => {
  // 初始化限制器
  await limiter.initialize()
  
  if (details.reason === 'install') {
    // 首次安装，打开欢迎页
    chrome.tabs.create({
      url: chrome.runtime.getURL('welcome.html'),
    })
  } else if (details.reason === 'update') {
    // 更新，检查数据迁移
    console.log('Extension updated to version', chrome.runtime.getManifest().version)
  }
})

// ==================== 定时任务 ====================

// 每小时检查一次激活码状态
chrome.alarms.create('licenseCheck', { periodInMinutes: 60 })

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'licenseCheck') {
    await limiter.initialize()
  }
})

// ==================== 防调试保护 ====================

// 检测开发者工具
let devtoolsOpen = false

// @ts-ignore
window.addEventListener('devtoolschange', (e: any) => {
  devtoolsOpen = e.detail.isOpen
  if (devtoolsOpen) {
    console.clear()
    // 可以添加额外的保护措施
  }
})

// 定期检查调试器
setInterval(() => {
  const start = performance.now()
  debugger // 如果有调试器，这里会暂停
  const end = performance.now()
  
  if (end - start > 100) {
    // 检测到调试器，可能有人在逆向
    console.warn('Debugger detected')
  }
}, 1000)