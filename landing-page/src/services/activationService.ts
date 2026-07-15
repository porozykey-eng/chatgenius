// 激活码服务 - 服务器 API 版本
const API_BASE = '/api';

// P2-2 修复：fetch 超时工具（8 秒）
function fetchWithTimeout(url: string, options?: RequestInit, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

export const activationService = {
  // 验证激活码
  async validateCode(inputCode: string): Promise<{ valid: boolean; type?: string; error?: string }> {
    try {
      const code = inputCode.trim().toUpperCase();

      // P2-2 修复：添加 8 秒超时
      const res = await fetchWithTimeout(`${API_BASE}/license/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (data.valid) {
        // P1-11 修复：网页端存储仅用于显示历史，扩展端需要用户手动输入激活码
        // key 改为 chatgenius_web_license 避免与扩展端 chrome.storage.local 混淆
        localStorage.setItem('chatgenius_web_license', JSON.stringify({
          code,
          type: data.type,
          activatedAt: new Date().toISOString(),
        }));
      }

      return { valid: data.valid, type: data.type, error: data.error };
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return { valid: false, error: '请求超时，请检查网络后重试' };
      }
      console.error('Validate code error:', err);
      return { valid: false, error: '网络错误，请检查网络连接' };
    }
  },

  // 创建支付订单（调用服务器支付 API）
  // P0 安全修复：订单号由服务端生成（crypto.randomBytes），前端不再生成
  async createOrder(
    _plan: string,
    _price: string,
    type: 'year' | 'lifetime',
    channel: 'alipay' | 'wechat' | 'paypal',
    _userEmail?: string
  ): Promise<{ success: boolean; payForm?: string; codeUrl?: string; orderNo?: string; error?: string }> {
    try {
      // 根据渠道调用不同的 API
      const apiPath = channel === 'wechat' ? '/wechat/create-order' : '/alipay/create-order';
      // P2-2 修复：添加 10 秒超时（支付订单创建可能较慢）
      const res = await fetchWithTimeout(`${API_BASE}${apiPath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      }, 10000);

      const data = await res.json();

      if (data.success) {
        if (data.codeUrl) {
          // 微信支付返回二维码链接
          return { success: true, codeUrl: data.codeUrl, orderNo: data.orderNo };
        } else if (data.payForm) {
          // 支付宝返回表单 HTML
          return { success: true, payForm: data.payForm, orderNo: data.orderNo };
        }
      }

      return { success: false, error: data.error || '创建订单失败' };
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return { success: false, error: '请求超时，请检查网络后重试' };
      }
      console.error('Create order error:', err);
      return { success: false, error: '网络错误，请检查网络连接' };
    }
  },

  // 查询支付状态
  // H5 修复：根据 channel 调用对应渠道端点，避免微信订单走支付宝端点导致查询失败
  // P2-4 修复：channel 改为必填参数，避免默认 alipay 导致微信订单查询失败
  async queryPaymentStatus(orderNo: string, channel: 'alipay' | 'wechat'): Promise<{ paid: boolean; status?: string; activationCode?: string; type?: string; error?: string }> {
    try {
      const endpoint = channel === 'wechat' ? '/wechat/query-order/' : '/alipay/query-order/';
      // P2-2 修复：添加 8 秒超时
      const res = await fetchWithTimeout(`${API_BASE}${endpoint}${encodeURIComponent(orderNo)}`);
      const data = await res.json();
      return {
        paid: data.paid,
        status: data.status,
        activationCode: data.activationCode,
        type: data.type,
        error: data.error,
      };
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return { paid: false, error: '查询超时，请稍后重试' };
      }
      console.error('Query payment status error:', err);
      return { paid: false, error: '查询失败' };
    }
  },

  // 获取许可证信息
  // P1-11 修复：网页端存储仅用于显示，扩展端需用户手动输入激活码激活
  async getLicense(_userEmail?: string): Promise<{ type?: string; expiresAt?: string; isActive: boolean } | null> {
    try {
      // 从网页端 localStorage 获取（仅用于网页端显示状态）
      const localLicense = localStorage.getItem('chatgenius_web_license');
      if (localLicense) {
        const parsed = JSON.parse(localLicense);
        return {
          type: parsed.type,
          expiresAt: parsed.type === 'year'
            ? new Date(Date.parse(parsed.activatedAt) + 365 * 24 * 60 * 60 * 1000).toISOString()
            : undefined,
          isActive: true,
        };
      }

      return null;
    } catch (err) {
      console.error('Get license error:', err);
      return null;
    }
  },

  // 检查许可证是否有效
  async isLicenseValid(): Promise<boolean> {
    const license = await this.getLicense();
    if (!license || !license.isActive) return false;

    if (license.type === 'year' && license.expiresAt) {
      return new Date(license.expiresAt) > new Date();
    }

    return true;
  },
};
