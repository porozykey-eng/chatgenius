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

    // 1. Navigator 信息
    components.push(navigator.userAgent || '');
    components.push(navigator.language || '');
    components.push((navigator.languages || []).join(','));
    components.push(navigator.platform || '');
    components.push(String(navigator.hardwareConcurrency || 0));
    components.push(String(navigator.deviceMemory || 0));
    components.push(String(navigator.maxTouchPoints || 0));
    components.push(String(navigator.cookieEnabled || false));
    components.push(String(navigator.doNotTrack || ''));

    // 2. Screen 信息
    components.push(String(screen.width || 0));
    components.push(String(screen.height || 0));
    components.push(String(screen.availWidth || 0));
    components.push(String(screen.availHeight || 0));
    components.push(String(screen.colorDepth || 0));
    components.push(String(screen.pixelDepth || 0));
    components.push(String(window.devicePixelRatio || 1));

    // 3. 时区
    try {
      components.push(Intl.DateTimeFormat().resolvedOptions().timeZone || '');
    } catch (e) {
      components.push('');
    }
    components.push(String(new Date().getTimezoneOffset()));

    // 4. Canvas 指纹
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 50;
      const ctx = canvas.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(0, 0, 100, 30);
      ctx.fillStyle = '#069';
      ctx.fillText('ChatGenius-FP-2026', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('ChatGenius-FP-2026', 4, 17);
      components.push(canvas.toDataURL());
    } catch (e) {
      components.push('canvas-error');
    }

    // 5. WebGL 指纹（如果可用）
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          components.push(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '');
          components.push(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '');
        }
      }
    } catch (e) {
      // WebGL 不可用，跳过
    }

    // 6. Audio 指纹（如果可用）
    try {
      const AudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      if (AudioContext) {
        const audioCtx = new AudioContext(1, 5000, 44100);
        const oscillator = audioCtx.createOscillator();
        oscillator.type = 'triangle';
        oscillator.frequency.value = 1000;
        const compressor = audioCtx.createDynamicsCompressor();
        compressor.threshold.value = -50;
        compressor.knee.value = 40;
        compressor.ratio.value = 12;
        compressor.attack.value = 0;
        compressor.release.value = 0.25;
        oscillator.connect(compressor);
        compressor.connect(audioCtx.destination);
        oscillator.start(0);
        const buffer = await audioCtx.startRendering();
        const samples = buffer.getChannelData(0);
        let sum = 0;
        for (let i = 4500; i < 5000; i++) {
          sum += Math.abs(samples[i]);
        }
        components.push(String(sum));
      }
    } catch (e) {
      // Audio 不可用，跳过
    }

    // 合并所有特征并生成 SHA-256 哈希
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
