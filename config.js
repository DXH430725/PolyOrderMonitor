import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 读取 Polymarket API 凭证
function loadPolymarketConfig() {
  const content = readFileSync(join(__dirname, 'polyprivate.key'), 'utf-8');
  const config = {};

  // 解析格式: api_key='value', api_secret='value', api_passphrase='value'
  const apiKeyMatch = content.match(/api_key='([^']+)'/);
  const apiSecretMatch = content.match(/api_secret='([^']+)'/);
  const apiPassphraseMatch = content.match(/api_passphrase='([^']+)'/);

  if (apiKeyMatch) config.apiKey = apiKeyMatch[1];
  if (apiSecretMatch) config.apiSecret = apiSecretMatch[1];
  if (apiPassphraseMatch) config.apiPassphrase = apiPassphraseMatch[1];

  return config;
}

// 读取 Telegram 配置
function loadTelegramConfig() {
  const content = readFileSync(join(__dirname, 'telegramChatid.txt'), 'utf-8');
  const lines = content.split('\n').map(line => line.trim()).filter(line => line);

  const config = {};

  for (const line of lines) {
    if (line.includes('DXHNotice:')) {
      const chatIdMatch = line.match(/DXHNotice:\s*(-?\d+)/);
      if (chatIdMatch) config.chatId = chatIdMatch[1];
    } else if (line.match(/^\d+:[A-Za-z0-9_-]+$/)) {
      config.botToken = line;
    }
  }

  return config;
}

export function loadConfig() {
  const polymarket = loadPolymarketConfig();
  const telegram = loadTelegramConfig();

  return {
    polymarket,
    telegram,
    websocket: {
      url: 'wss://ws-subscriptions-clob.polymarket.com/ws/user'
    }
  };
}
