import { AV } from '../lib/leancloudClient';

// 激活码服务 - LeanCloud 版本
export const activationService = {
  // 验证激活码
  async validateCode(inputCode: string): Promise<{ valid: boolean; type?: string; error?: string }> {
    try {
      // 检查 LeanCloud 是否已初始化
      if (!AV.applicationId) {
        return { valid: false, error: 'LeanCloud 未配置，请先配置环境变量' };
      }

      const code = inputCode.trim().toUpperCase();

      // 查询激活码
      const ActivationCode = AV.Object.extend('ActivationCode');
      const query = new AV.Query(ActivationCode);
      query.equalTo('code', code);
      const activationCode = await query.first();

      if (!activationCode) {
        return { valid: false, error: '激活码无效' };
      }

      if (activationCode.get('status') === 'used') {
        return { valid: false, error: '激活码已使用' };
      }

      const licenseType = activationCode.get('type');
      const now = new Date();

      // 标记为已使用（使用 fetchWhenSave 确保原子性）
      activationCode.set('status', 'used');
      activationCode.set('usedAt', now);
      await activationCode.save(null, { fetchWhenSave: true });

      // 再次检查状态，防止并发消费
      if (activationCode.get('status') !== 'used') {
        return { valid: false, error: '激活码消费失败，请重试' };
      }

      // 创建许可证
      const License = AV.Object.extend('License');
      const license = new License();
      license.set('activationCode', activationCode.get('code'));
      license.set('type', licenseType);
      license.set('activatedAt', now);
      license.set('isActive', true);
      
      // 年付设置过期时间
      if (licenseType === 'year') {
        const expiresAt = new Date(now);
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        license.set('expiresAt', expiresAt);
      }
      
      await license.save();

      // 存储到本地缓存
      localStorage.setItem('chatgenius_license', JSON.stringify({
        code: activationCode.get('code'),
        type: licenseType,
        activatedAt: now.toISOString(),
      }));

      return { valid: true, type: licenseType };
    } catch (err) {
      console.error('Validate code error:', err);
      return { valid: false, error: '网络错误，请检查网络连接' };
    }
  },

  // 创建订单
  async createOrder(
    plan: string,
    price: string,
    type: 'year' | 'lifetime',
    channel: 'alipay' | 'wechat' | 'paypal',
    userEmail?: string
  ): Promise<{ success: boolean; order?: any; error?: string }> {
    try {
      const orderNo = `CG${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const Order = AV.Object.extend('Order');
      const order = new Order();
      order.set('orderNo', orderNo);
      order.set('plan', plan);
      order.set('price', price);
      order.set('type', type);
      order.set('channel', channel);
      order.set('status', 'pending');
      order.set('createdAt', new Date());
      
      if (userEmail) {
        order.set('userEmail', userEmail);
      }

      await order.save();

      return { 
        success: true, 
        order: {
          orderNo: order.get('orderNo'),
          plan: order.get('plan'),
          price: order.get('price'),
          type: order.get('type'),
          channel: order.get('channel'),
          status: order.get('status'),
          createdAt: order.get('createdAt'),
        }
      };
    } catch (err) {
      console.error('Create order error:', err);
      return { success: false, error: '创建订单失败' };
    }
  },

  // 完成支付并生成激活码
  async completePayment(orderNo: string): Promise<{ success: boolean; activationCode?: string; error?: string }> {
    try {
      // 查询订单
      const Order = AV.Object.extend('Order');
      const query = new AV.Query(Order);
      query.equalTo('orderNo', orderNo);
      const order = await query.first();

      if (!order) {
        return { success: false, error: '订单不存在' };
      }

      if (order.get('status') === 'completed') {
        return { success: false, error: '订单已完成' };
      }

      // 生成激活码
      const activationCode = `${order.get('type') === 'year' ? 'YEAR' : 'PRO'}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      // 添加激活码到数据库
      const ActivationCode = AV.Object.extend('ActivationCode');
      const newCode = new ActivationCode();
      newCode.set('code', activationCode);
      newCode.set('type', order.get('type'));
      newCode.set('status', 'unused');
      newCode.set('createdAt', new Date());
      await newCode.save();

      // 更新订单状态
      order.set('status', 'completed');
      order.set('completedAt', new Date());
      order.set('activationCode', activationCode);
      await order.save();

      return { success: true, activationCode };
    } catch (err) {
      console.error('Complete payment error:', err);
      return { success: false, error: '网络错误' };
    }
  },

  // 获取许可证信息
  async getLicense(userEmail?: string): Promise<{ type?: string; expiresAt?: string; isActive: boolean } | null> {
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

      // 从 LeanCloud 获取
      if (userEmail) {
        const License = AV.Object.extend('License');
        const query = new AV.Query(License);
        query.equalTo('userEmail', userEmail);
        query.equalTo('isActive', true);
        query.descending('activatedAt');
        const license = await query.first();

        if (!license) return null;

        return {
          type: license.get('type'),
          expiresAt: license.get('expiresAt')?.toISOString(),
          isActive: license.get('isActive'),
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

    // 检查年付是否过期
    if (license.type === 'year' && license.expiresAt) {
      return new Date(license.expiresAt) > new Date();
    }

    return true;
  },
};
