require('dotenv').config();

const { Telegraf } = require('telegraf');
const { execFile } = require('child_process');

const TELEGRAM_LIMIT = 4096;

if (!process.env.TELEGRAM_TOKEN) {
  console.error('TELEGRAM_TOKEN belum diisi. Buat file .env dari .env.example lalu isi token bot Telegram.');
  process.exit(1);
}

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

function tempoRequest(args, callback) {
  execFile(
    'tempo',
    ['request', ...args],
    {
      timeout: 120000,
      maxBuffer: 1024 * 1024
    },
    callback
  );
}

function getCommandInput(ctx, command) {
  return ctx.message.text.replace(new RegExp(`^/${command}(?:@\\w+)?\\s*`, 'i'), '').trim();
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

function logTempoError(service, error, stdout, stderr) {
  console.error(`[${service}] Tempo request gagal`);

  if (error) {
    console.error(error.message);
  }

  if (stderr) {
    console.error(stderr);
  }

  if (stdout) {
    console.error(stdout);
  }
}

function parseJson(stdout) {
  try {
    return JSON.parse(stdout);
  } catch (error) {
    throw new Error(`JSON tidak valid: ${error.message}`);
  }
}

// GPT
bot.command('gpt', (ctx) => {
  const prompt = getCommandInput(ctx, 'gpt');

  if (!prompt) {
    return ctx.reply('Contoh:\n/gpt halo');
  }

  ctx.reply('GPT sedang berpikir...');

  const payload = JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Jawab dalam bahasa Indonesia.'
      },
      {
        role: 'user',
        content: prompt
      }
    ]
  });

  tempoRequest([
    '-X', 'POST',
    'https://openai.mpp.tempo.xyz/v1/chat/completions',
    '-H', 'Content-Type: application/json',
    '-d', payload
  ], async (error, stdout, stderr) => {
    if (error) {
      logTempoError('GPT', error, stdout, stderr);
      return ctx.reply('Error GPT. Cek console log untuk detail.');
    }

    try {
      const data = parseJson(stdout);
      const content = data?.choices?.[0]?.message?.content;
      return replyLong(ctx, content);
    } catch (parseError) {
      logTempoError('GPT', parseError, stdout, stderr);
      return ctx.reply('Response GPT tidak valid.');
    }
  });
});

// DEEPSEEK
bot.command('deepseek', (ctx) => {
  const prompt = getCommandInput(ctx, 'deepseek');

  if (!prompt) {
    return ctx.reply('Contoh:\n/deepseek halo');
  }

  ctx.reply('DeepSeek sedang berpikir...');

  const payload = JSON.stringify({
    model: 'deepseek-chat',
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  });

  tempoRequest([
    '-X', 'POST',
    'https://deepseek.mpp.paywithlocus.com/deepseek/chat',
    '-H', 'Content-Type: application/json',
    '-d', payload
  ], async (error, stdout, stderr) => {
    if (error) {
      logTempoError('DeepSeek', error, stdout, stderr);
      return ctx.reply('Error DeepSeek. Cek console log untuk detail.');
    }

    try {
      const data = parseJson(stdout);
      const content = data?.data?.choices?.[0]?.message?.content || data?.choices?.[0]?.message?.content;
      return replyLong(ctx, content);
    } catch (parseError) {
      logTempoError('DeepSeek', parseError, stdout, stderr);
      return ctx.reply('Response DeepSeek tidak valid.');
    }
  });
});

// EXA SEARCH
bot.command('exa', (ctx) => {
  const query = getCommandInput(ctx, 'exa');

  if (!query) {
    return ctx.reply('Contoh:\n/exa berita bitcoin');
  }

  ctx.reply('Exa sedang mencari...');

  const payload = JSON.stringify({
    query,
    numResults: 5
  });

  tempoRequest([
    '-X', 'POST',
    'https://exa.mpp.tempo.xyz/search',
    '-H', 'Content-Type: application/json',
    '-d', payload
  ], async (error, stdout, stderr) => {
    if (error) {
      logTempoError('Exa', error, stdout, stderr);
      return ctx.reply('Error Exa. Cek console log untuk detail.');
    }

    try {
      const data = parseJson(stdout);
      const results = data?.results || data?.data?.results || [];

      if (!results.length) {
        return ctx.reply('Tidak ada hasil.');
      }

      const reply = results.map((result, index) => {
        const title = result.title || 'Tanpa judul';
        const url = result.url || 'URL tidak tersedia';
        return `${index + 1}. ${title}\n${url}`;
      }).join('\n\n');

      return replyLong(ctx, reply);
    } catch (parseError) {
      logTempoError('Exa', parseError, stdout, stderr);
      return ctx.reply('Response Exa tidak valid.');
    }
  });
});

bot.start((ctx) => {
  ctx.reply('Bot aktif!\n\n/gpt halo\n/deepseek halo\n/exa berita bitcoin');
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

console.log('Bot aktif...');
