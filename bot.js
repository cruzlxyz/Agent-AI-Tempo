'use strict';

require('dotenv').config();

const { Telegraf } = require('telegraf');
const { execFile } = require('child_process');

// ============================================================================
// Configuration
// ============================================================================

const TELEGRAM_LIMIT = 4096;
const REQUEST_TIMEOUT_MS = parseInt(process.env.REQUEST_TIMEOUT_MS || '120000', 10);
const COOLDOWN_MS = parseInt(process.env.COOLDOWN_MS || '5000', 10);
const ALLOWED_USERS = (process.env.ALLOWED_USERS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// Per-user cooldown tracking: { userId: lastInvocationTimestamp }
const cooldownTracker = new Map();

// ============================================================================
// Validation
// ============================================================================

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`${name} belum diisi. Buat file .env dari .env.example lalu isi.`);
    process.exit(1);
  }
  return value;
}

const TELEGRAM_TOKEN = requireEnv('TELEGRAM_TOKEN');
const bot = new Telegraf(TELEGRAM_TOKEN);

// ============================================================================
// Helpers
// ============================================================================

function tempoRequest(args) {
  return new Promise((resolve, reject) => {
    execFile(
      'tempo',
      ['request', ...args],
      { timeout: REQUEST_TIMEOUT_MS, maxBuffer: 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          error.stderr = stderr;
          error.stdout = stdout;
          return reject(error);
        }
        resolve(stdout);
      }
    );
  });
}

function safeParse(stdout, label) {
  try {
    return JSON.parse(stdout);
  } catch (err) {
    const snippet = String(stdout).slice(0, 200);
    throw new Error(`[${label}] response bukan JSON valid: ${err.message}. Snippet: ${snippet}`);
  }
}

async function replyLong(ctx, text) {
  const message = String(text || '').trim();
  if (!message) {
    return ctx.reply('Response kosong.');
  }
  for (let i = 0; i < message.length; i += TELEGRAM_LIMIT) {
    await ctx.reply(message.slice(i, i + TELEGRAM_LIMIT));
  }
}

function logTempoError(service, error, context = {}) {
  console.error(`[${service}] Tempo request gagal`);
  if (error?.message) console.error('  Error:', error.message);
  if (error?.stderr) console.error('  Stderr:', error.stderr);
  if (error?.stdout) console.error('  Stdout:', String(error.stdout).slice(0, 500));
  if (Object.keys(context).length) console.error('  Context:', context);
}

function extractUserInput(ctx, command) {
  return ctx.message.text.replace(new RegExp(`^/${command}(?:@\\w+)?\\s*`, 'i'), '').trim();
}

// ============================================================================
// Auth + rate limiting middleware
// ============================================================================

function authorizeAndThrottle(getServiceName) {
  return async (ctx, next) => {
    const userId = String(ctx.from?.id || '');
    const service = getServiceName(ctx);

    // Whitelist check
    if (ALLOWED_USERS.length > 0 && !ALLOWED_USERS.includes(userId)) {
      return ctx.reply(`Akses ditolak. User ID kamu: ${userId}. Minta owner buat nambahin ke ALLOWED_USERS di .env.`);
    }

    // Cooldown check (per service per user)
    const key = `${userId}:${service}`;
    const now = Date.now();
    const last = cooldownTracker.get(key) || 0;
    if (now - last < COOLDOWN_MS) {
      const remaining = Math.ceil((COOLDOWN_MS - (now - last)) / 1000);
      return ctx.reply(`Tunggu ${remaining} detik lagi sebelum pakai /${service} lagi.`);
    }
    cooldownTracker.set(key, now);

    return next();
  };
}

// ============================================================================
// Command factory — register one Tempo-backed command
// ============================================================================

function registerCommand({ name, url, model, buildPayload, extractContent, thinkingMessage, example }) {
  bot.command(name, authorizeAndThrottle(() => name), async (ctx) => {
    const prompt = extractUserInput(ctx, name);
    if (!prompt) {
      return ctx.reply(`Contoh:\n/${name} ${example}`);
    }

    await ctx.reply(thinkingMessage);

    const payload = buildPayload(prompt);

    try {
      const stdout = await tempoRequest([
        '-X', 'POST',
        url,
        '-H', 'Content-Type: application/json',
        '-d', JSON.stringify(payload),
      ]);

      const data = safeParse(stdout, name.toUpperCase());
      const content = extractContent(data);
      return replyLong(ctx, content);
    } catch (err) {
      logTempoError(name, err, { userId: ctx.from?.id, model });
      if (err.message?.startsWith('[')) {
        return ctx.reply(`Response ${name} tidak valid. Cek console log untuk detail.`);
      }
      return ctx.reply(`Error ${name}. Cek console log untuk detail.`);
    }
  });
}

// ============================================================================
// Commands
// ============================================================================

registerCommand({
  name: 'gpt',
  url: process.env.GPT_URL || 'https://openai.mpp.tempo.xyz/v1/chat/completions',
  model: process.env.GPT_MODEL || 'gpt-4o-mini',
  thinkingMessage: 'GPT sedang berpikir...',
  example: 'halo',
  buildPayload: (prompt) => ({
    model: process.env.GPT_MODEL || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Jawab dalam bahasa Indonesia.' },
      { role: 'user', content: prompt },
    ],
  }),
  extractContent: (data) => data?.choices?.[0]?.message?.content,
});

registerCommand({
  name: 'deepseek',
  url: process.env.DEEPSEEK_URL || 'https://deepseek.mpp.paywithlocus.com/deepseek/chat',
  model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
  thinkingMessage: 'DeepSeek sedang berpikir...',
  example: 'halo',
  buildPayload: (prompt) => ({
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
    messages: [
      { role: 'system', content: 'Jawab dalam bahasa Indonesia.' },
      { role: 'user', content: prompt },
    ],
  }),
  extractContent: (data) =>
    data?.data?.choices?.[0]?.message?.content || data?.choices?.[0]?.message?.content,
});

registerCommand({
  name: 'exa',
  url: process.env.EXA_URL || 'https://exa.mpp.tempo.xyz/search',
  thinkingMessage: 'Exa lagi cari...',
  example: 'berita bitcoin hari ini',
  buildPayload: (prompt) => ({
    query: prompt,
    numResults: 5,
  }),
  extractContent: (data) => {
    if (typeof data === 'string') return data;
    const results = data?.results || data?.data?.results || [];
    if (!Array.isArray(results) || results.length === 0) return 'Tidak ada hasil.';
    return results
      .map((r, i) => `${i + 1}. ${r.title || r.url}\n   ${r.url}\n   ${(r.snippet || r.text || '').slice(0, 200)}`)
      .join('\n\n');
  },
});

// ============================================================================
// Help
// ============================================================================

bot.command('help', (ctx) => {
  return ctx.reply(
    'Commands:\n' +
    '/gpt <prompt>      Tanya GPT-4o\n' +
    '/deepseek <prompt> Tanya DeepSeek\n' +
    '/exa <query>       Cari web via Exa\n' +
    '/help              Tampilkan pesan ini'
  );
});

// ============================================================================
// Boot
// ============================================================================

bot.launch().then(() => {
  console.log('Bot aktif...');
  console.log(`Auth: ${ALLOWED_USERS.length > 0 ? `${ALLOWED_USERS.length} user di-whitelist` : 'PUBLIC (semua user bisa pakai)'}`);
  console.log(`Cooldown: ${COOLDOWN_MS}ms per user per service`);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
