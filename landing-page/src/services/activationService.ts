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

  // 创建支付订单（调用服务器支付宝 API - 电脑网站支付）
  async createOrder(
    _plan: string,
    price: string,
    type: 'year' | 'lifetime',
    _channel: 'alipay' | 'wechat' | 'paypal',
    _userEmail?: string
  ): Promise<{ success: boolean; payForm?: string; orderNo?: string; error?: string }> {
    try {
      const orderNo = `CG${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const subject = `ChatGenius AI Pro ${type === 'year' ? '年付' : '永久版'}`;

      const cleanPrice = price.replace(/[^0-9.]/g, '');
      const res = await fetch(`${API_BASE}/alipay/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNo, amount: cleanPrice, subject }),
      });

      const data = await res.json();

      if (data.success && data.payForm) {
        return { success: true, payForm: data.payForm, orderNo };
      }

      return { success: false, error: data.error || '创建订单失败' };
    } catch (err) {
      console.error('Create order error:', err);
      return { success: false, error: '网络错误，请检查网络连接' };
    }
  },

  // 查询支付状态
  async queryPaymentStatus(orderNo: string): Promise<{ paid: boolean; status?: string; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/alipay/query-order/${encodeURIComponent(orderNo)}`);
      const data = await res.json();
      return { paid: data.paid, status: data.status, error: data.error };
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
