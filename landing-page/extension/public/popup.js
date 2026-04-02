/**
 * ChatGenius AI - Popup Script
 */

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', async () => {
  await loadQuota()
  await loadSettings()
  await checkLicenseStatus()
  setupEventListeners()
})

// ==================== 配额管理 ====================
async function loadQuota() {
  const response = await sendMessage({ action: 'getQuota' })
  
  updateQuotaDisplay(response)
}

function updateQuotaDisplay(data: any) {
  const remainingEl = document.getElementById('remaining-count')
  const totalEl = document.getElementById('quota-total')
  const barFillEl = document.getElementById('quota-bar-fill')
  const slashEl = document.getElementById('quota-slash')
  const proBadgeEl = document.getElementById('pro-badge')
  const activationSection = document.getElementById('activation-section')
  const proSection = document.getElementById('pro-section')

  if (data.isPro || data.unlimited) {
    // Pro 用户
    remainingEl!.textContent = '∞'
    totalEl!.style.display = 'none'
    slashEl!.style.display = 'none'
    barFillEl!.style.width = '100%'
    barFillEl!.classList.add('pro')
    proBadgeEl!.style.display = 'inline-block'
    activationSection!.style.display = 'none'
    proSection!.style.display = 'block'
  } else {
    // 免费用户
    const limit = data.limit || 50
    const remaining = Math.max(0, data.remaining)
    
    remainingEl!.textContent = remaining.toString()
    totalEl!.textContent = limit.toString()
    slashEl!.style.display = 'inline'
    totalEl!.style.display = 'inline'
    
    const percentage = (remaining / limit) * 100
    barFillEl!.style.width = `${percentage}%`
    
    if (remaining === 0) {
      barFillEl!.classList.add('empty')
    }
  }
}

// ==================== 激活码处理 ====================
async function checkLicenseStatus() {
  const response = await sendMessage({ action: 'getLicenseInfo' })
  
  if (response.success && response.isPro) {
    document.getElementById('activation-section')!.style.display = 'none'
    document.getElementById('pro-section')!.style.display = 'block'
  }
}

async function handleActivation() {
  const input = document.getElementById('license-input') as HTMLInputElement
  const messageEl = document.getElementById('activation-message')
  const activateBtn = document.getElementById('activate-btn') as HTMLButtonElement
  
  const code = input.value.trim().toUpperCase()
  
  if (!code) {
    showActivationMessage('请输入激活码', 'error')
    return
  }
  
  activateBtn.disabled = true
  activateBtn.textContent = '激活中...'
  
  try {
    const response = await sendMessage({ 
      action: 'activateLicense', 
      code 
    })
    
    if (response.success) {
      showActivationMessage('激活成功！', 'success')
      await loadQuota()
      checkLicenseStatus()
    } else {
      showActivationMessage(response.message || '激活失败', 'error')
    }
  } catch (error) {
    showActivationMessage('激活失败，请稍后重试', 'error')
  } finally {
    activateBtn.disabled = false
    activateBtn.textContent = '激活'
  }
}

function showActivationMessage(message: string, type: 'success' | 'error') {
  const messageEl = document.getElementById('activation-message')
  messageEl!.textContent = message
  messageEl!.className = `activation-message ${type}`
  messageEl!.style.display = 'block'
  
  setTimeout(() => {
    messageEl!.style.display = 'none'
  }, 3000)
}

// ==================== 设置管理 ====================
async function loadSettings() {
  const data = await chrome.storage.sync.get(['apiKey', 'model', 'tone'])
  
  const apiKeyInput = document.getElementById('api-key-input') as HTMLInputElement
  const modelSelect = document.getElementById('model-select') as HTMLSelectElement
  const toneSelect = document.getElementById('tone-select') as HTMLSelectElement
  
  if (data.apiKey) {
    apiKeyInput.value = data.apiKey
  }
  if (data.model) {
    modelSelect.value = data.model
  }
  if (data.tone) {
    toneSelect.value = data.tone
  }
}

async function saveSettings() {
  const apiKeyInput = document.getElementById('api-key-input') as HTMLInputElement
  const modelSelect = document.getElementById('model-select') as HTMLSelectElement
  const toneSelect = document.getElementById('tone-select') as HTMLSelectElement
  
  await chrome.storage.sync.set({
    apiKey: apiKeyInput.value,
    model: modelSelect.value,
    tone: toneSelect.value,
  })
}

// ==================== 事件监听 ====================
function setupEventListeners() {
  // 激活按钮
  document.getElementById('activate-btn')?.addEventListener('click', handleActivation)
  
  // 回车激活
  document.getElementById('license-input')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleActivation()
    }
  })
  
  // 设置变更自动保存
  const settingsInputs = ['api-key-input', 'model-select', 'tone-select']
  settingsInputs.forEach(id => {
    document.getElementById(id)?.addEventListener('change', saveSettings)
  })
}

// ==================== 工具函数 ====================
function sendMessage(message: any): Promise<any> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, resolve)
  })
}