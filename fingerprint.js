// ChatGenius - 轻量级浏览器设备指纹生成器
// 基于浏览器原生 API 生成唯一设备指纹，不依赖外部库
// 适用于 Chrome Extension MV3 环境

(function (global) {
  'use strict';

  /**
   * 生成设备指纹哈希
   * 收集浏览器多项特征，通过 SHA-256 生成唯一指纹
   * @returns {Promise<string>} 指纹哈希（64位十六进制字符串）
   */
  async function generateFingerprint() {
    const components = [];

    // 严重修复:统一为 SW 可用的稳定特征集,与 background.js generateFingerprintInBackground 完全一致
    // SW 无 DOM,不能采集 canvas/WebGL/Audio;两端特征集必须完全相同,否则缓存丢失后指纹不一致导致误下线

    // 1. Navigator 信息(SW 可用)
    components.push(navigator.userAgent || '');
    components.push(navigator.language || '');
    components.push((navigator.languages || []).join(','));
    components.push(navigator.platform || '');
    components.push(String(navigator.hardwareConcurrency || 0));
    components.push(String(navigator.deviceMemory || 0));

    // 2. Screen 信息(SW 可用)
    components.push(String(screen.width || 0));
    components.push(String(screen.height || 0));
    components.push(String(screen.colorDepth || 0));

    // 3. 时区(SW 可用)
    try {
      components.push(Intl.DateTimeFormat().resolvedOptions().timeZone || '');
    } catch (e) {
      components.push('');
    }
    components.push(String(new Date().getTimezoneOffset()));

    // 合并所有特征并生成 SHA-256 哈希(分隔符与 background.js 一致: '|||')
    const raw = components.join('|||');
    const hash = await sha256(raw);
    return hash;
  }

  /**
   * SHA-256 哈希
   */
  async function sha256(message) {
    if (global.crypto && global.crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(message);
      const hashBuffer = await global.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    // 降级：简单哈希（非加密安全，但足够唯一）
    let hash = 0;
    for (let i = 0; i < message.length; i++) {
      const char = message.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  }

  /**
   * 获取设备指纹（带缓存）
   * 优先从 chrome.storage.local 读取缓存，不存在则生成
   * @returns {Promise<string>}
   */
  async function getDeviceFingerprint() {
    // 尝试从缓存读取
    if (global.chrome && global.chrome.storage && global.chrome.storage.local) {
      return new Promise((resolve) => {
        chrome.storage.local.get(['deviceFingerprint'], async (result) => {
          if (result.deviceFingerprint) {
            resolve(result.deviceFingerprint);
          } else {
            const fp = await generateFingerprint();
            chrome.storage.local.set({ deviceFingerprint: fp });
            resolve(fp);
          }
        });
      });
    }
    // 非扩展环境（预览/测试）
    return generateFingerprint();
  }

  /**
   * 生成 HMAC-SHA256 签名
   * @param {string} code - 激活码
   * @param {string} timestamp - 时间戳
   * @param {string} secret - 密钥
   * @returns {Promise<string>} 签名
   */
  async function signRequest(code, timestamp, secret) {
    const message = code + timestamp;
    if (global.crypto && global.crypto.subtle) {
      const keyData = new TextEncoder().encode(secret);
      const key = await global.crypto.subtle.importKey(
        'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
      );
      const msgBuffer = new TextEncoder().encode(message);
      const sigBuffer = await global.crypto.subtle.sign('HMAC', key, msgBuffer);
      const sigArray = Array.from(new Uint8Array(sigBuffer));
      return sigArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    // 降级
    return sha256(message + secret);
  }

  // 导出
  global.FingerprintUtil = {
    generateFingerprint,
    getDeviceFingerprint,
    signRequest,
  };
})(typeof window !== 'undefined' ? window : self);
