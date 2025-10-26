# Polymarket Order Monitor

实时监控 Polymarket 账户订单成交，并通过 Telegram 发送通知。

## 功能特性

- 实时监听 Polymarket 订单成交事件
- 自动重连机制
- Telegram 消息通知
- 支持订单和交易事件

## 配置文件

程序需要两个配置文件：

### 1. polyprivate.key

存储 Polymarket API 凭证。复制 `polyprivate.key.example` 并重命名为 `polyprivate.key`，然后填入你的凭证：
使用generateapikey.py生成密钥，需要钱包私钥，如果不放心，请参照官方文档生成：https://docs.polymarket.com/quickstart/websocket/WSS-Quickstart

```
api_key='your-api-key',
api_secret='your-api-secret',
api_passphrase='your-api-passphrase'
```

### 2. telegramChatid.txt

存储 Telegram Bot 配置。复制 `telegramChatid.txt.example` 并重命名为 `telegramChatid.txt`，然后填入你的配置：

```
your-bot-token:from-botfather
DXHNotice: -your-chat-id-here
```

**注意：** 这些文件包含敏感信息，已在 `.gitignore` 中排除，不会被提交到版本控制。

## 安装依赖

```bash
npm install
```

## 运行程序

```bash
npm start
```

或

```bash
node index.js
```

## 程序结构

- `index.js` - 主程序，WebSocket 连接和事件处理
- `config.js` - 配置文件读取模块
- `telegram.js` - Telegram 通知模块
- `polyprivate.key` - Polymarket API 凭证（不要提交到版本控制）
- `telegramChatid.txt` - Telegram 配置（不要提交到版本控制）

## 事件类型

程序监听以下事件：

1. **Trade Event (交易事件)** - 订单成交时触发
   - 市价单成交
   - 限价单成交
   - 状态变更（MINED, CONFIRMED, RETRYING, FAILED）

2. **Order Event (订单事件)** - 订单状态变化时触发
   - PLACEMENT - 订单下单
   - UPDATE - 订单部分成交
   - CANCELLATION - 订单取消

## 通知格式

### 交易成交通知

```
🎯 Polymarket 订单成交通知

📅 时间: 2025-10-25 17:30:00
🆔 交易ID: abc123
📊 市场: 0x1234...
💰 价格: 0.65
📦 数量: 100
📈 状态: CONFIRMED
🔄 方向: 买入
```

### 订单更新通知

```
📋 Polymarket 订单更新

📅 时间: 2025-10-25 17:30:00
🆔 订单ID: order123
📊 市场: 0x1234...
💰 价格: 0.65
📦 原始数量: 100
✅ 已成交: 50
📈 事件类型: UPDATE
```

## 安全建议

1. 不要将 `polyprivate.key` 和 `telegramChatid.txt` 提交到版本控制
2. 定期更换 API 密钥
3. 使用专用的 Telegram Bot
4. 限制 API 密钥权限

## 故障排除

### WebSocket 连接失败

- 检查网络连接
- 验证 API 凭证是否正确
- 查看控制台错误日志

### Telegram 通知未收到

- 验证 Bot Token 是否正确
- 确认 Chat ID 格式正确
- 检查 Bot 是否已加入群组（如果使用群组）

## 优雅退出

使用 `Ctrl+C` 或发送 SIGTERM 信号可以优雅地关闭程序。

## 技术栈

- Node.js
- WebSocket (ws)
- Telegram Bot API
- Polymarket CLOB API
