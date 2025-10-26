import fetch from 'node-fetch';

export class TelegramNotifier {
  constructor(botToken, chatId) {
    this.botToken = botToken;
    this.chatId = chatId;
    this.baseUrl = `https://api.telegram.org/bot${botToken}`;
  }

  async sendMessage(text) {
    try {
      const response = await fetch(`${this.baseUrl}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: this.chatId,
          text: text,
          parse_mode: 'HTML',
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        console.error('Telegram API error:', data);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to send Telegram message:', error);
      return false;
    }
  }

  formatTradeNotification(trade) {
    const timestamp = new Date(trade.timestamp || Date.now()).toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    let message = `<b>🎯 Polymarket 订单成交通知</b>\n\n`;
    message += `📅 时间: ${timestamp}\n`;
    message += `🆔 交易ID: <code>${trade.id || 'N/A'}</code>\n`;
    message += `📊 市场: <code>${trade.market || 'N/A'}</code>\n`;
    message += `💰 价格: ${trade.price || 'N/A'}\n`;
    message += `📦 数量: ${trade.size || 'N/A'}\n`;
    message += `📈 状态: ${trade.status || 'N/A'}\n`;

    if (trade.side) {
      message += `🔄 方向: ${trade.side === 'BUY' ? '买入' : '卖出'}\n`;
    }

    if (trade.type) {
      message += `📝 类型: ${trade.type}\n`;
    }

    return message;
  }

  formatOrderNotification(order) {
    const timestamp = new Date(order.timestamp || Date.now()).toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    let message = `<b>📋 Polymarket 订单更新</b>\n\n`;
    message += `📅 时间: ${timestamp}\n`;
    message += `🆔 订单ID: <code>${order.id || 'N/A'}</code>\n`;
    message += `📊 市场: <code>${order.market || 'N/A'}</code>\n`;
    message += `💰 价格: ${order.price || 'N/A'}\n`;
    message += `📦 原始数量: ${order.original_size || 'N/A'}\n`;
    message += `✅ 已成交: ${order.size_matched || 'N/A'}\n`;
    message += `📈 事件类型: ${order.event_type || 'N/A'}\n`;

    return message;
  }

  async notifyTrade(trade) {
    const message = this.formatTradeNotification(trade);
    console.log('Sending trade notification...');
    return await this.sendMessage(message);
  }

  async notifyOrder(order) {
    const message = this.formatOrderNotification(order);
    console.log('Sending order notification...');
    return await this.sendMessage(message);
  }

  async sendStartupMessage() {
    const message = `<b>🚀 Polymarket Monitor 已启动</b>\n\n` +
                   `📅 启动时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n` +
                   `✅ 正在监听订单成交事件...`;
    return await this.sendMessage(message);
  }

  async sendErrorMessage(error) {
    const message = `<b>❌ Polymarket Monitor 错误</b>\n\n` +
                   `⚠️ 错误信息: ${error}\n` +
                   `📅 时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`;
    return await this.sendMessage(message);
  }
}
