// 发票服务 - 用户端 API
const API_BASE = '/api';

export interface InvoiceRequest {
  orderNo: string;
  invoiceType: 'personal' | 'company';
  title: string;
  taxNumber?: string;
  email: string;
}

export const invoiceService = {
  // 提交发票申请
  async submitInvoice(data: InvoiceRequest): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/invoice/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      return { success: result.success, error: result.error };
    } catch (err) {
      console.error('Submit invoice error:', err);
      return { success: false, error: '网络错误，请稍后重试' };
    }
  },

  // 查询订单的发票申请状态
  async getInvoiceStatus(orderNo: string): Promise<{
    exists: boolean;
    status?: 'pending' | 'issued' | 'rejected';
    invoiceUrl?: string;
    error?: string;
  }> {
    try {
      const res = await fetch(`${API_BASE}/invoice/status/${encodeURIComponent(orderNo)}`);
      const data = await res.json();
      return {
        exists: data.exists,
        status: data.status,
        invoiceUrl: data.invoiceUrl,
        error: data.error,
      };
    } catch (err) {
      console.error('Get invoice status error:', err);
      return { exists: false, error: '查询失败' };
    }
  },
};
