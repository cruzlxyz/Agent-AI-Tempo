# tempo-bot-101

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%E2%89%A518-green)](https://nodejs.org)
[![Telegram](https://img.shields.io/badge/Telegram-Bot-blue?logo=telegram)](https://telegram.org)
[![Tempo](https://img.shields.io/badge/Tempo-MPP-purple)](https://wallet.tempo.xyz/)

Telegram bot yang bridge ke **Tempo MPP** — panggil **GPT-4o**, **DeepSeek**, dan **Exa Search** langsung dari chat Telegram.

![demo](./docs/demo.png)
<!-- TODO: tambah screenshot atau GIF demo di sini -->

## Fitur

- 🤖 **Multi-model AI** — GPT-4o (via Tempo OpenAI MPP), DeepSeek, Exa web search
- 🔐 **User whitelist** — opsional, batasi bot ke Telegram user ID tertentu
- ⏱️ **Per-user cooldown** — anti-spam, hemat credit Tempo
- 🪟 **WSL friendly** — install step-by-step dari nol untuk Windows user
- 🐧 **Native Linux/macOS** — works juga di luar WSL
- 📡 **Long message support** — Telegram 4096 char limit di-chunk otomatis

## Requirements

- **Node.js ≥ 18** ([download](https://nodejs.org/en/download))
- **Tempo wallet** ([install](https://wallet.tempo.xyz/))
- **Telegram Bot** dari [@BotFather](https://t.me/BotFather)
- Windows 10/11 butuh WSL Ubuntu (lihat step 1)

---

## Quick Start (Native Linux/macOS)

```bash
# 1. Install Tempo CLI
curl -fsSL https://tempo.xyz/install | bash
source ~/.bashrc
tempo wallet login

# 2. Clone & install
git clone https://github.com/cruzlxyz/tempo-bot-101.git
cd tempo-bot-101
npm install

# 3. Setup .env
cp .env.example .env
nano .env   # isi TELEGRAM_TOKEN

# 4. Run
npm start
```

## Windows + WSL Install (Step-by-step)

### 1. Install WSL

Buka **PowerShell as Administrator**:

```powershell
wsl --install
```

Restart laptop, lalu buka Ubuntu dari Start Menu.

### 2. Install Package

```bash
sudo apt update
sudo apt install nodejs npm git curl -y
```

> Butuh Node ≥ 18? Cek `node --version`. Kalau masih v12, pake [nvm](https://github.com/nvm-sh/nvm):
> ```bash
> curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
> source ~/.bashrc
> nvm install 18
> ```

### 3. Install Tempo CLI

```bash
curl -fsSL https://tempo.xyz/install | bash
source ~/.bashrc
tempo --version
```

### 4. Login Tempo

```bash
tempo wallet login
```

### 5. Install Dependencies

```bash
git clone https://github.com/cruzlxyz/tempo-bot-101.git
cd tempo-bot-101
npm install
```

> `node_modules` tidak disimpan di git. Selalu jalankan `npm install` setelah clone.

### 6. Setup .env

```bash
cp .env.example .env
nano .env
```

Isi minimal:

```env
TELEGRAM_TOKEN=*** (optional) Whitelist user IDs. Cari tau ID kamu: kirim message ke [@userinfobot](https://t.me/userinfobot) di Telegram, format: `123456789`, pisahin pake koma kalau lebih dari satu.

### 7. Run Bot

```bash
npm start
```

Atau langsung:

```bash
node bot.js
```

Output kalau berhasil:

```text
Bot aktif...
Auth: 1 user di-whitelist
Cooldown: 5000ms per user per service
```

---

## Commands

| Command | Contoh | Deskripsi |
|---|---|---|
| `/gpt <prompt>` | `/gpt halo` | Tanya GPT-4o (default model: `gpt-4o-mini`) |
| `/deepseek <prompt>` | `/deepseek halo` | Tanya DeepSeek |
| `/exa <query>` | `/exa berita bitcoin hari ini` | Cari web via Exa, return top 5 |
| `/help` | `/help` | List semua command |

---

## Configuration

Semua via `.env`. Lihat `.env.example` untuk full list. Highlight:

| Variable | Default | Kapan diubah |
|---|---|---|
| `TELEGRAM_TOKEN` | — (required) | Selalu |
| `ALLOWED_USERS` | kosong = public | Set kalau mau private bot |
| `COOLDOWN_MS` | `5000` | Naikin kalau user sering complain cooldown |
| `GPT_MODEL` | `gpt-4o-mini` | Ganti ke `gpt-4o` atau model lain yang disupport Tempo |
| `DEEPSEEK_MODEL` | `deepseek-chat` | Sama |
| `REQUEST_TIMEOUT_MS` | `120000` | Naikkin kalau Exa sering timeout |

---

## Troubleshooting

<details>
<summary><b>`tempo: command not found`</b></summary>

Install Tempo CLI:
```bash
curl -fsSL https://tempo.xyz/install | bash
source ~/.bashrc
```
Cek dengan `tempo --version`. Kalau masih gak ada, PATH belum ke-reload — tutup & buka terminal baru.

</details>

<details>
<summary><b>`TELEGRAM_TOKEN belum diisi`</b></summary>

`.env` belum dibuat atau token belum diisi. Jalankan:
```bash
cp .env.example .env
nano .env
# isi TELEGRAM_TOKEN=<token dari @BotFather>
```

</details>

<details>
<summary><b>`Bot aktif...` tapi command gak ada respon</b></summary>

1. Cek bot udah di-start di Telegram: `/start`
2. Cek `ALLOWED_USERS` di `.env` — kalau di-set, pastikan ID Telegram kamu termasuk
3. Cek console log buat error dari Tempo — mungkin wallet belum ke-topup

</details>

<details>
<summary><b>`Tempo request gagal` di console log</b></summary>

1. Cek `tempo wallet login` udah jalan dan wallet aktif
2. Cek credit Tempo cukup
3. Cek URL MPP di `.env` masih valid (`https://openai.mpp.tempo.xyz/v1/chat/completions`, dll)
4. Test manual:
   ```bash
   tempo request -X POST https://openai.mpp.tempo.xyz/v1/chat/completions \
     -H "Content-Type: application/json" \
     -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"halo"}]}'
   ```

</details>

<details>
<summary><b>Cooldown terlalu lama / terlalu cepet</b></summary>

Adjust `COOLDOWN_MS` di `.env`:
```env
COOLDOWN_MS=2000   # 2 detik
COOLDOWN_MS=10000  # 10 detik
```

</details>

<details>
<summary><b>Bot error setelah beberapa jam idle</b></summary>

Telegram bot butuh **long polling** yang keep-alive. Kalo deploy di server, pake `systemd` atau `pm2`:
```bash
npm install -g pm2
pm2 start bot.js --name agent-ai-tempo
pm2 save
pm2 startup
```

</details>

---

## Architecture

```
User (Telegram)
     │
     ▼
Telegraf bot (bot.js)
     │  auth + cooldown check
     ▼
tempo request <args>
     │
     ▼
Tempo CLI ──── Tempo Wallet
     │              │
     ▼              ▼
openai.mpp.tempo.xyz     (chat completions)
deepseek.mpp.paywithlocus.com
exa.mpp.tempo.xyz        (web search)
```

Bot tinggal jadi thin wrapper — semua kerjaan AI & bayar di-handle Tempo. Kamu cuma butuh Telegram token (gratis) + Tempo wallet.

---

## Contributing

PR welcome! Liat [Issues](https://github.com/cruzlxyz/tempo-bot-101/issues) buat list ide.

Setup local:
```bash
git clone https://github.com/cruzlxyz/tempo-bot-101.git
cd tempo-bot-101
npm install
cp .env.example .env
# edit .env, npm start
```

Format commit: pake [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, dll).

## License

[MIT](./LICENSE) © 2026 cruzlxyz
