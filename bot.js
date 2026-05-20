require('dotenv').config();

const { Telegraf } = require('telegraf');
const { execFile } = require('child_process');

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

function tempoRequest(args, callback) {
  execFile('tempo', ['request', ...args], callback);
}

// GPT
bot.command('gpt', (ctx) => {

  const prompt =
    ctx.message.text.replace('/gpt', '').trim();

  if (!prompt) {
    return ctx.reply(
      'Contoh:\n/gpt halo'
    );
  }

  ctx.reply('GPT sedang berpikir...');

  const payload = JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'Jawab dalam bahasa Indonesia.'
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
  ], (error, stdout) => {

    if (error) {
      return ctx.reply('Error GPT');
    }

    try {

      const data = JSON.parse(stdout);

      ctx.reply(
        data.choices[0].message.content
      );

    } catch {

      ctx.reply('Response error');

    }
  });
});

// DEEPSEEK
bot.command('deepseek', (ctx) => {

  const prompt =
    ctx.message.text.replace('/deepseek', '').trim();

  if (!prompt) {
    return ctx.reply(
      'Contoh:\n/deepseek halo'
    );
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
  ], (error, stdout) => {

    if (error) {
      return ctx.reply('Error DeepSeek');
    }

    try {

      const data = JSON.parse(stdout);

      ctx.reply(
        data.data.choices[0].message.content
      );

    } catch {

      ctx.reply('Response error');

    }
  });
});

// EXA SEARCH
bot.command('exa', (ctx) => {

  const query =
    ctx.message.text.replace('/exa', '').trim();

  if (!query) {
    return ctx.reply(
      'Contoh:\n/exa berita bitcoin'
    );
  }

  ctx.reply('Exa sedang mencari...');

  const payload = JSON.stringify({
    query: query,
    numResults: 5
  });

  tempoRequest([
    '-X', 'POST',
    'https://exa.mpp.tempo.xyz/search',
    '-H', 'Content-Type: application/json',
    '-d', payload
  ], (error, stdout) => {

    if (error) {
      return ctx.reply('Error Exa');
    }

    try {

      const data = JSON.parse(stdout);

      const results = data.results || [];

      if (!results.length) {
        return ctx.reply('Tidak ada hasil.');
      }

      const reply = results.map((r, i) =>
        `${i + 1}. ${r.title}\n${r.url}`
      ).join('\n\n');

      ctx.reply(reply);

    } catch {

      ctx.reply('Response error');

    }
  });
});

bot.start((ctx) => {
  ctx.reply(
    'Bot aktif!\n\n/gpt\n/deepseek\n/exa'
  );
});

bot.launch();

console.log('Bot aktif...');