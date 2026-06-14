import AV from 'leancloud-storage';

// LeanCloud 项目配置（国内版需要 serverURL）
const appId = import.meta.env.VITE_LEANCLOUD_APP_ID;
const appKey = import.meta.env.VITE_LEANCLOUD_APP_KEY;

// 仅在配置有效时初始化
if (appId && appKey && appId !== 'your-app-id' && appKey !== 'your-app-key') {
  AV.init({
    appId,
    appKey,
    serverURL: 'https://avoscloud.com', // LeanCloud 国内版服务器地址
  });
}

export { AV };

// LeanCloud 数据表类型定义
export interface LCActivationCode {
  id: string;
  code: string;
  type: 'year' | 'lifetime' | 'free';
  status: 'unused' | 'used';
  usedAt?: Date;
  createdAt: Date;
}

export interface LCOrder {
  id: string;
  orderNo: string;
  plan: string;
  price: string;
  type: 'year' | 'lifetime';
  channel: 'alipay' | 'wechat';
  status: 'pending' | 'completed' | 'cancelled';
  activationCode?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface LCLicense {
  id: string;
  activationCode: string;
  type: 'year' | 'lifetime' | 'free';
  activatedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}
