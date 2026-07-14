// 激活码服务 - 服务器 API 版本
const API_BASE = '/api';

export const activationService = {
  // 验证激活码
  async validateCode(inputCode: string): Promise<{ valid: boolean; type?: string; error?: string }> {
    try {
      const code = inputCode.trim().toUpperCase();

      const res = await fetch(`${API_BASE}/license/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (data.valid) {
        // 激活成功，存储到本地
        localStorage.setItem('chatgenius_license', JSON.stringify({
          code,
          type: data.type,
          activatedAt: new Date().toISOString(),
        }));
      }

      return { valid: data.valid, type: data.type, error: data.error };
    } catch (err) {
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
      const res = await fetch(`${API_BASE}${apiPath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });

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
      console.error('Create order error:', err);
      return { success: false, error: '网络错误，请检查网络连接' };
    }
  },

  // 查询支付状态
  // H5 修复：根据 channel 调用对应渠道端点，避免微信订单走支付宝端点导致查询失败
  async queryPaymentStatus(orderNo: string, channel: 'alipay' | 'wechat' = 'alipay'): Promise<{ paid: boolean; status?: string; activationCode?: string; type?: string; error?: string }> {
    try {
      const endpoint = channel === 'wechat' ? '/wechat/query-order/' : '/alipay/query-order/';
      const res = await fetch(`${API_BASE}${endpoint}${encodeURIComponent(orderNo)}`);
      const data = await res.json();
      return {
        paid: data.paid,
        status: data.status,
        activationCode: data.activationCode,
        type: data.type,
        error: data.error,
      };
    } catch (err) {
      console.error('Query payment status error:', err);
      return { paid: false, error: '查询失败' };
    }
  },

  // 获取许可证信息
  async getLicense(_userEmail?: string): Promise<{ type?: string; expiresAt?: string; isActive: boolean } | null> {
    try {
      // 优先从本地获取
      const localLicense = localStorage.getItem('chatgenius_license');
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
