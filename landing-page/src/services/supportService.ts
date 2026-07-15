import { AV } from '../lib/leancloudClient';

// 客服支持系统 - LeanCloud 版本
export interface SupportTicket {
  id?: string;
  user_email: string;
  subject: string;
  description: string;
  category: 'billing' | 'technical' | 'feature_request' | 'bug_report' | 'other';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at?: string;
  updated_at?: string;
}

export interface SupportMessage {
  id?: string;
  ticket_id: string;
  sender: 'user' | 'support';
  sender_email: string;
  message: string;
  created_at?: string;
}

export const supportService = {
  // 创建支持工单
  async createTicket(ticket: SupportTicket): Promise<{ success: boolean; ticketId?: string; error?: string }> {
    try {
      const SupportTicketObj = AV.Object.extend('SupportTicket');
      const newTicket = new SupportTicketObj();
      
      newTicket.set('userEmail', ticket.user_email);
      newTicket.set('subject', ticket.subject);
      newTicket.set('description', ticket.description);
      newTicket.set('category', ticket.category);
      newTicket.set('status', 'open');
      newTicket.set('priority', ticket.priority);
      newTicket.set('createdAt', new Date());
      newTicket.set('updatedAt', new Date());

      await newTicket.save();

      return { success: true, ticketId: newTicket.id };
    } catch (error) {
      console.error('Create ticket error:', error);
      return { success: false, error: '创建工单失败' };
    }
  },

  // 获取用户的所有工单
  async getUserTickets(email: string): Promise<{ success: boolean; tickets?: SupportTicket[]; error?: string }> {
    try {
      const SupportTicketObj = AV.Object.extend('SupportTicket');
      const query = new AV.Query(SupportTicketObj);
      query.equalTo('userEmail', email);
      query.descending('createdAt');
      const tickets = await query.find();

      const result = tickets.map(t => ({
        id: t.id,
        user_email: t.get('userEmail'),
        subject: t.get('subject'),
        description: t.get('description'),
        category: t.get('category'),
        status: t.get('status'),
        priority: t.get('priority'),
        created_at: t.get('createdAt')?.toISOString(),
        updated_at: t.get('updatedAt')?.toISOString(),
      }));

      return { success: true, tickets: result };
    } catch (error) {
      console.error('Get tickets error:', error);
      return { success: false, error: '获取工单失败' };
    }
  },

  // 添加工单消息
  async addMessage(message: SupportMessage): Promise<{ success: boolean; error?: string }> {
    try {
      if (!message.ticket_id || !message.message?.trim()) {
        return { success: false, error: '缺少工单ID或消息内容' };
      }
      
      const SupportMessageObj = AV.Object.extend('SupportMessage');
      const newMessage = new SupportMessageObj();
      
      newMessage.set('ticketId', message.ticket_id);
      newMessage.set('sender', message.sender);
      newMessage.set('senderEmail', message.sender_email);
      newMessage.set('message', message.message.trim());
      newMessage.set('createdAt', new Date());

      await newMessage.save();

      // 更新工单状态（单独 try/catch 避免消息已发送但状态更新失败导致整体失败）
      try {
        const SupportTicketObj = AV.Object.extend('SupportTicket');
        const ticketQuery = new AV.Query(SupportTicketObj);
        const ticket = await ticketQuery.get(message.ticket_id);
        
        if (ticket) {
          ticket.set('updatedAt', new Date());
          ticket.set('status', message.sender === 'support' ? 'in_progress' : 'open');
          await ticket.save();
        }
      } catch (ticketUpdateError) {
        console.warn('Failed to update ticket status (message was saved):', ticketUpdateError);
      }

      return { success: true };
    } catch (error) {
      console.error('Add message error:', error);
      return { success: false, error: '发送消息失败' };
    }
  },

  // 获取工单的所有消息
  async getTicketMessages(ticketId: string): Promise<{ success: boolean; messages?: SupportMessage[]; error?: string }> {
    try {
      const SupportMessageObj = AV.Object.extend('SupportMessage');
      const query = new AV.Query(SupportMessageObj);
      query.equalTo('ticketId', ticketId);
      query.ascending('createdAt');
      const messages = await query.find();

      const result = messages.map(m => ({
        id: m.id,
        ticket_id: m.get('ticketId'),
        sender: m.get('sender'),
        sender_email: m.get('senderEmail'),
        message: m.get('message'),
        created_at: m.get('createdAt')?.toISOString(),
      }));

      return { success: true, messages: result };
    } catch (error) {
      console.error('Get messages error:', error);
      return { success: false, error: '获取消息失败' };
    }
  },

  // 关闭工单
  async closeTicket(ticketId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const SupportTicketObj = AV.Object.extend('SupportTicket');
      const query = new AV.Query(SupportTicketObj);
      const ticket = await query.get(ticketId);

      if (ticket) {
        ticket.set('status', 'closed');
        ticket.set('updatedAt', new Date());
        await ticket.save();
      }

      return { success: true };
    } catch (error) {
      console.error('Close ticket error:', error);
      return { success: false, error: '关闭工单失败' };
    }
  },

  // 发送即时消息（通过邮件）
  async sendInstantMessage(
    email: string,
    subject: string,
    message: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // TODO: 集成邮件服务发送邮件
      console.log('Send email to support@chatgenius.ai:', { email, subject, message });
      
      return { success: true };
    } catch (error) {
      console.error('Send instant message error:', error);
      return { success: false, error: '发送邮件失败' };
    }
  },

  // 获取常见问题
  async getFAQs(): Promise<Array<{ question: string; answer: string }>> {
    return [
      {
        question: '如何获取 API Key？',
        answer: '访问 OpenAI、Anthropic 或 Google 的官方网站，注册账号并创建 API Key。',
      },
      {
        question: '免费版有什么限制？',
        answer: '免费版每日限制 50 次 AI 回复。升级到 Pro 版可享受无限制使用。',
      },
      {
        question: '如何升级 Pro 版？',
        answer: '在官网点击"立即购买"，选择支付宝支付，完成支付后使用激活码激活。',
      },
      {
        question: '支持哪些 AI 模型？',
        answer: '支持 OpenAI GPT-3.5/4、Anthropic Claude、Google Gemini 等多种主流模型。',
      },
      {
        question: '数据是否安全？',
        answer: '是的，所有数据仅存储在本地浏览器中，我们不会收集或上传您的聊天内容。',
      },
    ];
  },
};
