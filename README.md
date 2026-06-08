# Agent-AI-Tempo

Telegram AI Bot using Tempo MPP.

## Features

- GPT via Tempo
- DeepSeek via Tempo
- Exa Search via Tempo
- Telegram Bot
- WSL Ubuntu Support

## Requirements

- Windows 10 / 11
- WSL Ubuntu
- [Node.js](https://nodejs.org/en/download)
- [BotFather](https://t.me/BotFather)
- [Tempo Wallet](https://wallet.tempo.xyz/)

## 1. Install WSL

```powershell
wsl --install
```

Restart laptop, lalu buka Ubuntu.

## 2. Install Package

```bash
sudo apt update
sudo apt install nodejs npm git curl -y
```

## 3. Install Tempo CLI

```bash
curl -fsSL https://tempo.xyz/install | bash
source ~/.bashrc
tempo --version
```

## 4. Login Tempo

```bash
tempo wallet login
```

## 5. Install Dependencies

```bash
npm install
```

> Catatan: `node_modules` tidak disimpan di git. Selalu jalankan `npm install` setelah clone repo.

## 6. Setup .env

Copy file contoh:

```bash
cp .env.example .env
nano .env
```

Isi token bot Telegram kamu:

```env
TELEGRAM_TOKEN=TOKEN_BOT_KAMU
```

Save di nano:

```text
CTRL + O
ENTER
CTRL + X
```

## 7. Run Bot

```bash
npm start
```

Atau langsung:

```bash
node bot.js
```

Jika berhasil:

```text
Bot aktif...
```

## Commands

```bash
/gpt halo
/deepseek halo
/exa berita bitcoin hari ini
```

## Test / Syntax Check

```bash
npm test
```

## Stop Bot

```text
CTRL + C
```

## Run Again

```bash
npm start
```

DONE
