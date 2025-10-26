import WebSocket from 'ws';
import { loadConfig } from './config.js';
import { TelegramNotifier } from './telegram.js';

class PolymarketMonitor {
  constructor(config) {
    this.config = config;
    this.ws = null;
    this.telegram = new TelegramNotifier(
      config.telegram.botToken,
      config.telegram.chatId
    );
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 5000;
    this.isConnected = false;
    this.heartbeatInterval = null;
  }

  async start() {
    console.log('Starting Polymarket Monitor...');
    console.log('Polymarket API Key:', this.config.polymarket.apiKey);
    console.log('Telegram Chat ID:', this.config.telegram.chatId);

    await this.telegram.sendStartupMessage();
    this.connect();
  }

  connect() {
    console.log(`Connecting to ${this.config.websocket.url}...`);

    try {
      this.ws = new WebSocket(this.config.websocket.url);

      this.ws.on('open', () => {
        console.log('WebSocket connected!');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.subscribe();
        this.startHeartbeat();
      });

      this.ws.on('message', (data) => {
        this.handleMessage(data);
      });

      this.ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.telegram.sendErrorMessage(`WebSocket error: ${error.message}`);
      });

      this.ws.on('close', () => {
        console.log('WebSocket closed');
        this.isConnected = false;
        this.stopHeartbeat();
        this.reconnect();
      });

    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.reconnect();
    }
  }

  subscribe() {
    const subscribeMessage = {
      markets: [],  // 空数组表示订阅所有市场
      type: 'user',
      auth: {
        apiKey: this.config.polymarket.apiKey,
        secret: this.config.polymarket.apiSecret,
        passphrase: this.config.polymarket.apiPassphrase
      }
    };

    console.log('Sending subscription message...');
    console.log('Auth credentials:', {
      apiKey: this.config.polymarket.apiKey,
      secretLength: this.config.polymarket.apiSecret?.length,
      passphraseLength: this.config.polymarket.apiPassphrase?.length
    });
    this.ws.send(JSON.stringify(subscribeMessage));
    console.log('Subscription sent successfully');
  }

  handleMessage(data) {
    const messageStr = data.toString();

    // 处理 PONG 消息（心跳响应）
    if (messageStr === 'PONG') {
      // 静默处理 PONG 消息
      return;
    }

    try {
      const message = JSON.parse(messageStr);

      console.log('Received message:', JSON.stringify(message, null, 2));

      // 处理不同类型的消息
      if (message.event_type === 'trade' || message.type === 'trade') {
        this.handleTradeEvent(message);
      } else if (message.event_type === 'order' || message.type === 'order') {
        this.handleOrderEvent(message);
      } else if (message.type === 'subscribed') {
        console.log('Successfully subscribed to channel');
      } else if (message.type === 'error') {
        console.error('Server error:', message);
        this.telegram.sendErrorMessage(`Server error: ${JSON.stringify(message)}`);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
      console.error('Raw message:', messageStr);
    }
  }

  handleTradeEvent(trade) {
    console.log('Trade event detected!');
    console.log('Trade details:', JSON.stringify(trade, null, 2));

    // 提取交易信息
    const tradeInfo = {
      id: trade.id || trade.trade_id,
      market: trade.market || trade.asset_id,
      price: trade.price,
      size: trade.size,
      status: trade.status,
      side: trade.side,
      type: trade.type || 'TRADE',
      timestamp: trade.timestamp || Date.now()
    };

    // 发送 Telegram 通知
    this.telegram.notifyTrade(tradeInfo);
  }

  handleOrderEvent(order) {
    console.log('Order event detected!');
    console.log('Order details:', JSON.stringify(order, null, 2));

    // 只在订单有成交时发送通知（部分成交或全部成交）
    if (order.event_type === 'UPDATE' || (order.size_matched && parseFloat(order.size_matched) > 0)) {
      const orderInfo = {
        id: order.id || order.order_id,
        market: order.market || order.asset_id,
        price: order.price,
        original_size: order.original_size || order.size,
        size_matched: order.size_matched || order.matched,
        event_type: order.event_type,
        timestamp: order.timestamp || Date.now()
      };

      // 发送 Telegram 通知
      this.telegram.notifyOrder(orderInfo);
    }
  }

  startHeartbeat() {
    // 每10秒发送一次心跳（根据官方示例）
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send('PING');
      }
    }, 10000);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.telegram.sendErrorMessage('Max reconnection attempts reached. Please restart the monitor.');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Reconnecting in ${this.reconnectDelay / 1000}s... (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);
  }

  stop() {
    console.log('Stopping monitor...');
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
    }
  }
}

// 主程序入口
async function main() {
  try {
    const config = loadConfig();

    if (!config.polymarket.apiKey || !config.polymarket.apiSecret || !config.polymarket.apiPassphrase) {
      throw new Error('Polymarket API credentials not found');
    }

    if (!config.telegram.botToken || !config.telegram.chatId) {
      throw new Error('Telegram credentials not found');
    }

    const monitor = new PolymarketMonitor(config);
    await monitor.start();

    // 优雅退出
    process.on('SIGINT', () => {
      console.log('\nReceived SIGINT, shutting down gracefully...');
      monitor.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\nReceived SIGTERM, shutting down gracefully...');
      monitor.stop();
      process.exit(0);
    });

  } catch (error) {
    console.error('Failed to start monitor:', error);
    process.exit(1);
  }
}

main();
