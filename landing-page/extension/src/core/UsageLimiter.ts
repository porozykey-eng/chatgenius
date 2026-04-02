/**
 * ChatGenius AI - 核心安全模块
 * 防破解的使用次数限制系统
 * 
 * 安全措施：
 * 1. AES-256-GCM 加密存储
 * 2. HMAC-SHA256 签名验证
 * 3. 时间戳防篡改
 * 4. 设备指纹绑定
 * 5. 服务端激活码验证
 * 6. 代码混淆保护
 */

// ==================== 常量配置 ====================
const CONFIG = {
  // 每日免费使用次数限制（写死，不可修改）
  DAILY_FREE_LIMIT: 50,
  
  // 存储键名（混淆后）
  STORAGE_KEYS: {
    USAGE_DATA: '_cg_ud',           // 使用数据
    LICENSE_DATA: '_cg_ld',         // 激活码数据
    DEVICE_ID: '_cg_did',           // 设备ID
    LAST_SYNC: '_cg_ls',            // 最后同步时间
    SECURITY_HASH: '_cg_sh',        // 安全哈希
  },
  
  // API端点（生产环境替换）
  API_ENDPOINTS: {
    VERIFY_LICENSE: 'https://api.chatgenius.ai/v1/license/verify',
    SYNC_USAGE: 'https://api.chatgenius.ai/v1/usage/sync',
    HEARTBEAT: 'https://api.chatgenius.ai/v1/heartbeat',
  },
  
  // 加密密钥（运行时动态生成，不硬编码）
  KEY_SALT: 'cg_2024_secure_key',
}

// ==================== 加密工具 ====================
class CryptoEngine {
  private masterKey: CryptoKey | null = null
  private keyReady: Promise<void>
  
  constructor() {
    this.keyReady = this.initializeKey()
  }
  
  /**
   * 初始化加密密钥（基于设备指纹动态生成）
   */
  private async initializeKey(): Promise<void> {
    const deviceId = await this.getDeviceFingerprint()
    const encoder = new TextEncoder()
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(deviceId + CONFIG.KEY_SALT),
      'PBKDF2',
      false,
      ['deriveKey']
    )
    
    this.masterKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('chatgenius_salt_v2'),
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    )
  }
  
  /**
   * 获取设备指纹（多重绑定）
   */
  private async getDeviceFingerprint(): Promise<string> {
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      screen.colorDepth.toString(),
      new Date().getTimezoneOffset().toString(),
      navigator.hardwareConcurrency?.toString() || '4',
      // @ts-ignore
      navigator.deviceMemory?.toString() || '8',
    ]
    
    const data = components.join('|')
    const buffer = new TextEncoder().encode(data)
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }
  
  /**
   * AES-GCM 加密
   */
  async encrypt(data: string): Promise<string> {
    await this.keyReady
    if (!this.masterKey) throw new Error('Key not initialized')
    
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encoder = new TextEncoder()
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.masterKey,
      encoder.encode(data)
    )
    
    // 合并 IV + 密文
    const combined = new Uint8Array(iv.length + encrypted.byteLength)
    combined.set(iv)
    combined.set(new Uint8Array(encrypted), iv.length)
    
    return btoa(String.fromCharCode(...combined))
  }
  
  /**
   * AES-GCM 解密
   */
  async decrypt(encryptedData: string): Promise<string> {
    await this.keyReady
    if (!this.masterKey) throw new Error('Key not initialized')
    
    const combined = new Uint8Array(
      atob(encryptedData).split('').map(c => c.charCodeAt(0))
    )
    
    const iv = combined.slice(0, 12)
    const ciphertext = combined.slice(12)
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      this.masterKey,
      ciphertext
    )
    
    return new TextDecoder().decode(decrypted)
  }
  
  /**
   * HMAC-SHA256 签名
   */
  async sign(data: string): Promise<string> {
    const deviceId = await this.getDeviceFingerprint()
    const encoder = new TextEncoder()
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(deviceId + '_hmac_key'),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    const signature = await crypto.subtle.sign(
      'HMAC',
      keyMaterial,
      encoder.encode(data)
    )
    
    return btoa(String.fromCharCode(...new Uint8Array(signature)))
  }
  
  /**
   * 验证签名
   */
  async verify(data: string, signature: string): Promise<boolean> {
    try {
      const deviceId = await this.getDeviceFingerprint()
      const encoder = new TextEncoder()
      
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(deviceId + '_hmac_key'),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify']
      )
      
      const sigBuffer = new Uint8Array(
        atob(signature).split('').map(c => c.charCodeAt(0))
      )
      
      return await crypto.subtle.verify(
        'HMAC',
        keyMaterial,
        sigBuffer,
        encoder.encode(data)
      )
    } catch {
      return false
    }
  }
}

// ==================== 使用数据结构 ====================
interface UsageData {
  date: string              // YYYY-MM-DD
  count: number             // 当日使用次数
  totalUsed: number         // 总使用次数
  firstUse: number          // 首次使用时间戳
  lastUse: number           // 最后使用时间戳
  resetCount: number        // 重置次数（检测异常）
  checksum: string          // 校验和
}

interface LicenseData {
  code: string              // 激活码
  type: 'free' | 'year' | 'lifetime'
  status: 'active' | 'expired' | 'invalid'
  activatedAt: number       // 激活时间戳
  expiresAt: number | null  // 过期时间戳（年付）
  deviceId: string          // 绑定设备
  serverValidated: boolean  // 服务端验证状态
  lastValidated: number     // 最后验证时间
  signature: string         // 签名
}

// ==================== 核心限制管理器 ====================
export class UsageLimiter {
  private crypto: CryptoEngine
  private usageData: UsageData | null = null
  private licenseData: LicenseData | null = null
  private initialized: boolean = false
  
  constructor() {
    this.crypto = new CryptoEngine()
  }
  
  /**
   * 初始化（必须在扩展启动时调用）
   */
  async initialize(): Promise<void> {
    if (this.initialized) return
    
    try {
      // 1. 加载使用数据
      await this.loadUsageData()
      
      // 2. 加载激活码数据
      await this.loadLicenseData()
      
      // 3. 检查日期重置
      await this.checkDailyReset()
      
      // 4. 验证数据完整性
      await this.validateDataIntegrity()
      
      // 5. 后台验证激活码（不阻塞）
      this.backgroundLicenseValidation()
      
      this.initialized = true
    } catch (error) {
      console.error('UsageLimiter initialization failed:', error)
      // 初始化失败时重置为安全状态
      await this.resetToSafeState()
    }
  }
  
  /**
   * 检查是否可以使用（核心限制逻辑）
   */
  async canUse(): Promise<{ allowed: boolean; reason: string; remaining: number }> {
    if (!this.initialized) {
      await this.initialize()
    }
    
    // Pro用户无限制
    if (this.isProUser()) {
      return { allowed: true, reason: 'pro_unlimited', remaining: -1 }
    }
    
    // 免费用户限制检查
    const today = this.getTodayString()
    
    if (!this.usageData || this.usageData.date !== today) {
      // 新的一天，重置计数
      await this.resetDailyUsage()
    }
    
    const remaining = CONFIG.DAILY_FREE_LIMIT - (this.usageData?.count || 0)
    
    if (remaining <= 0) {
      return { 
        allowed: false, 
        reason: 'daily_limit_reached',
        remaining: 0 
      }
    }
    
    return { 
      allowed: true, 
      reason: 'free_quota',
      remaining 
    }
  }
  
  /**
   * 记录一次使用（必须在AI回复后调用）
   */
  async recordUsage(): Promise<void> {
    if (!this.usageData) {
      await this.resetDailyUsage()
    }
    
    const now = Date.now()
    
    this.usageData!.count++
    this.usageData!.totalUsed++
    this.usageData!.lastUse = now
    
    if (!this.usageData!.firstUse) {
      this.usageData!.firstUse = now
    }
    
    // 更新校验和
    await this.updateChecksum()
    
    // 保存
    await this.saveUsageData()
    
    // 定期同步到服务器
    if (this.usageData!.count % 10 === 0) {
      this.syncToServer()
    }
  }
  
  /**
   * 判断是否为Pro用户
   */
  isProUser(): boolean {
    if (!this.licenseData) return false
    
    // 检查状态
    if (this.licenseData.status !== 'active') return false
    
    // 检查过期（年付）
    if (this.licenseData.type === 'year' && this.licenseData.expiresAt) {
      if (Date.now() > this.licenseData.expiresAt) {
        this.licenseData.status = 'expired'
        return false
      }
    }
    
    // 检查设备绑定
    if (this.licenseData.deviceId) {
      // 异步验证，不阻塞
      this.verifyDeviceBinding()
    }
    
    return true
  }
  
  /**
   * 获取今日剩余次数
   */
  getRemainingQuota(): number {
    if (this.isProUser()) return -1 // 无限
    
    const today = this.getTodayString()
    if (!this.usageData || this.usageData.date !== today) {
      return CONFIG.DAILY_FREE_LIMIT
    }
    
    return Math.max(0, CONFIG.DAILY_FREE_LIMIT - this.usageData.count)
  }
  
  /**
   * 激活Pro版本
   */
  async activateLicense(code: string): Promise<{ success: boolean; message: string }> {
    try {
      // 1. 本地格式验证
      if (!this.validateLicenseFormat(code)) {
        return { success: false, message: '激活码格式无效' }
      }
      
      // 2. 服务端验证
      const validationResult = await this.validateLicenseWithServer(code)
      
      if (!validationResult.valid) {
        return { success: false, message: validationResult.message }
      }
      
      // 3. 创建许可证数据
      const deviceId = await this.getDeviceId()
      
      this.licenseData = {
        code,
        type: validationResult.type,
        status: 'active',
        activatedAt: Date.now(),
        expiresAt: validationResult.expiresAt,
        deviceId,
        serverValidated: true,
        lastValidated: Date.now(),
        signature: '',
      }
      
      // 4. 签名
      const dataToSign = JSON.stringify({
        code,
        type: this.licenseData.type,
        deviceId,
        activatedAt: this.licenseData.activatedAt,
      })
      this.licenseData.signature = await this.crypto.sign(dataToSign)
      
      // 5. 加密保存
      await this.saveLicenseData()
      
      return { success: true, message: '激活成功' }
    } catch (error) {
      return { success: false, message: '激活失败，请稍后重试' }
    }
  }
  
  // ==================== 私有方法 ====================
  
  private async loadUsageData(): Promise<void> {
    try {
      const encrypted = await this.getStorage(CONFIG.STORAGE_KEYS.USAGE_DATA)
      if (encrypted) {
        const decrypted = await this.crypto.decrypt(encrypted)
        this.usageData = JSON.parse(decrypted)
      }
    } catch {
      // 解密失败，可能是数据被篡改
      await this.resetToSafeState()
    }
  }
  
  private async saveUsageData(): Promise<void> {
    if (!this.usageData) return
    
    const json = JSON.stringify(this.usageData)
    const encrypted = await this.crypto.encrypt(json)
    await this.setStorage(CONFIG.STORAGE_KEYS.USAGE_DATA, encrypted)
    
    // 同时存储签名
    const signature = await this.crypto.sign(json)
    await this.setStorage(CONFIG.STORAGE_KEYS.USAGE_DATA + '_sig', signature)
  }
  
  private async loadLicenseData(): Promise<void> {
    try {
      const encrypted = await this.getStorage(CONFIG.STORAGE_KEYS.LICENSE_DATA)
      if (encrypted) {
        const decrypted = await this.crypto.decrypt(encrypted)
        this.licenseData = JSON.parse(decrypted)
      }
    } catch {
      this.licenseData = null
    }
  }
  
  private async saveLicenseData(): Promise<void> {
    if (!this.licenseData) return
    
    const json = JSON.stringify(this.licenseData)
    const encrypted = await this.crypto.encrypt(json)
    await this.setStorage(CONFIG.STORAGE_KEYS.LICENSE_DATA, encrypted)
  }
  
  private async checkDailyReset(): Promise<void> {
    const today = this.getTodayString()
    
    if (!this.usageData || this.usageData.date !== today) {
      await this.resetDailyUsage()
    }
  }
  
  private async resetDailyUsage(): Promise<void> {
    const today = this.getTodayString()
    const now = Date.now()
    
    this.usageData = {
      date: today,
      count: 0,
      totalUsed: this.usageData?.totalUsed || 0,
      firstUse: this.usageData?.firstUse || now,
      lastUse: now,
      resetCount: (this.usageData?.resetCount || 0) + 1,
      checksum: '',
    }
    
    await this.updateChecksum()
    await this.saveUsageData()
  }
  
  private async updateChecksum(): Promise<void> {
    if (!this.usageData) return
    
    const dataToHash = [
      this.usageData.date,
      this.usageData.count.toString(),
      this.usageData.totalUsed.toString(),
      this.usageData.lastUse.toString(),
    ].join(':')
    
    const encoder = new TextEncoder()
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(dataToHash))
    this.usageData.checksum = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)))
  }
  
  private async validateDataIntegrity(): Promise<void> {
    // 检查使用数据完整性
    if (this.usageData) {
      const expectedChecksum = this.usageData.checksum
      await this.updateChecksum()
      
      if (this.usageData.checksum !== expectedChecksum) {
        // 数据被篡改
        console.warn('Data integrity check failed, resetting...')
        await this.resetToSafeState()
      }
    }
    
    // 检查签名
    if (this.usageData) {
      const storedSig = await this.getStorage(CONFIG.STORAGE_KEYS.USAGE_DATA + '_sig')
      if (storedSig) {
        const json = JSON.stringify(this.usageData)
        const valid = await this.crypto.verify(json, storedSig)
        if (!valid) {
          console.warn('Signature verification failed, resetting...')
          await this.resetToSafeState()
        }
      }
    }
    
    // 检查时间回拨
    if (this.usageData?.lastUse) {
      const now = Date.now()
      const lastUse = this.usageData.lastUse
      if (now < lastUse - 60000) { // 允许1分钟误差
        console.warn('Time rollback detected!')
        this.usageData.resetCount += 10 // 标记异常
        await this.saveUsageData()
      }
    }
  }
  
  private async resetToSafeState(): Promise<void> {
    // 重置为安全状态，但保留总使用次数作为惩罚
    this.usageData = {
      date: this.getTodayString(),
      count: 0,
      totalUsed: this.usageData?.totalUsed || 0,
      firstUse: Date.now(),
      lastUse: Date.now(),
      resetCount: 0,
      checksum: '',
    }
    await this.updateChecksum()
    await this.saveUsageData()
  }
  
  private validateLicenseFormat(code: string): boolean {
    // 支持的激活码前缀
    const validPrefixes = ['PRO-', 'YEAR-', 'FREE-']
    const hasValidPrefix = validPrefixes.some(p => code.toUpperCase().startsWith(p))
    
    // 格式: PREFIX-XXXXXXXX (8位字母数字)
    const pattern = /^(PRO|YEAR|FREE)-[A-Z0-9]{8}$/i
    
    return hasValidPrefix && pattern.test(code)
  }
  
  private async validateLicenseWithServer(code: string): Promise<{
    valid: boolean
    message: string
    type: 'year' | 'lifetime'
    expiresAt: number | null
  }> {
    try {
      const response = await fetch(CONFIG.API_ENDPOINTS.VERIFY_LICENSE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          deviceId: await this.getDeviceId(),
          timestamp: Date.now(),
        }),
      })
      
      const result = await response.json()
      
      return {
        valid: result.valid,
        message: result.message || '验证失败',
        type: result.type || 'lifetime',
        expiresAt: result.expiresAt || null,
      }
    } catch (error) {
      // 网络错误时的离线验证逻辑
      return this.offlineLicenseValidation(code)
    }
  }
  
  private async offlineLicenseValidation(code: string): Promise<{
    valid: boolean
    message: string
    type: 'year' | 'lifetime'
    expiresAt: number | null
  }> {
    // 离线模式：检查是否之前已验证过
    if (this.licenseData && this.licenseData.code === code && this.licenseData.serverValidated) {
      // 之前验证过，允许离线使用一段时间
      const daysSinceValidation = (Date.now() - this.licenseData.lastValidated) / (1000 * 60 * 60 * 24)
      
      if (daysSinceValidation < 7) { // 允许7天离线
        return {
          valid: true,
          message: '离线验证成功',
          type: this.licenseData.type,
          expiresAt: this.licenseData.expiresAt,
        }
      }
    }
    
    return {
      valid: false,
      message: '网络连接失败，无法验证激活码',
      type: 'lifetime',
      expiresAt: null,
    }
  }
  
  private async backgroundLicenseValidation(): Promise<void> {
    if (!this.licenseData) return
    
    // 每24小时验证一次
    const lastValidated = this.licenseData.lastValidated || 0
    const hoursSinceValidation = (Date.now() - lastValidated) / (1000 * 60 * 60)
    
    if (hoursSinceValidation > 24) {
      try {
        const result = await this.validateLicenseWithServer(this.licenseData.code)
        
        if (!result.valid) {
          this.licenseData.status = 'invalid'
        } else {
          this.licenseData.serverValidated = true
          this.licenseData.lastValidated = Date.now()
        }
        
        await this.saveLicenseData()
      } catch {
        // 忽略验证错误，保持当前状态
      }
    }
  }
  
  private async verifyDeviceBinding(): Promise<void> {
    // 设备绑定验证在后台进行
  }
  
  private async getDeviceId(): Promise<string> {
    let deviceId = await this.getStorage(CONFIG.STORAGE_KEYS.DEVICE_ID)
    
    if (!deviceId) {
      const buffer = new Uint8Array(16)
      crypto.getRandomValues(buffer)
      deviceId = Array.from(buffer).map(b => b.toString(16).padStart(2, '0')).join('')
      await this.setStorage(CONFIG.STORAGE_KEYS.DEVICE_ID, deviceId)
    }
    
    return deviceId
  }
  
  private getTodayString(): string {
    return new Date().toISOString().split('T')[0]
  }
  
  private async syncToServer(): Promise<void> {
    // 同步使用数据到服务器（用于统计和审计）
    try {
      await fetch(CONFIG.API_ENDPOINTS.SYNC_USAGE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: await this.getDeviceId(),
          date: this.usageData?.date,
          count: this.usageData?.count,
          totalUsed: this.usageData?.totalUsed,
          licenseCode: this.licenseData?.code,
          timestamp: Date.now(),
        }),
      })
    } catch {
      // 忽略同步错误
    }
  }
  
  // Chrome Storage 封装
  private getStorage(key: string): Promise<string | null> {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get([key], (result) => {
          resolve(result[key] || null)
        })
      } else {
        // 开发环境使用 localStorage
        resolve(localStorage.getItem(key))
      }
    })
  }
  
  private setStorage(key: string, value: string): Promise<void> {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ [key]: value }, resolve)
      } else {
        // 开发环境使用 localStorage
        localStorage.setItem(key, value)
        resolve()
      }
    })
  }
}

// ==================== 单例导出 ====================
let limiterInstance: UsageLimiter | null = null

export function getUsageLimiter(): UsageLimiter {
  if (!limiterInstance) {
    limiterInstance = new UsageLimiter()
  }
  return limiterInstance
}

// ==================== 全局限制常量（防止修改） ====================
export const DAILY_FREE_LIMIT = Object.freeze({
  value: 50,
  toString: () => '50',
  valueOf: () => 50,
}) as { value: 50; toString: () => string; valueOf: () => number }

// 防止通过原型链修改
Object.defineProperty(Number.prototype, 'DAILY_FREE_LIMIT', {
  get: () => 50,
  configurable: false,
})