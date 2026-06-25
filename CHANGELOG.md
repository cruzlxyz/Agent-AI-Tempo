# Changelog

All notable changes to this project will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-06-25

### Added
- User whitelist via `ALLOWED_USERS` env var (Telegram user IDs, comma-separated)
- Per-user per-service cooldown via `COOLDOWN_MS` env var (default 5000ms)
- Factory pattern for command registration (`registerCommand`) — eliminates copy-paste handlers
- Native Linux/macOS install path (in addition to WSL Ubuntu)
- `/help` command listing all available commands
- Configurable URLs and models via env vars (`GPT_URL`, `GPT_MODEL`, `DEEPSEEK_URL`, `DEEPSEEK_MODEL`, `EXA_URL`)
- `REQUEST_TIMEOUT_MS` env var
- Issue templates (bug report, feature request)
- CHANGELOG.md
- LICENSE (MIT)

### Changed
- Refactored `bot.js`: extracted `tempoRequest` as Promise-based helper, `safeParse` for JSON with label-aware error
- Error messages now include actionable hints (e.g., "Cek API key Tempo di wallet")
- All command handlers now use a single code path via factory
- GPT and DeepSeek both use Indonesian system prompt for consistency
- README: added badges, troubleshooting section, architecture diagram, native install path

### Security
- Optional user whitelist prevents unauthorized use
- Per-user cooldown prevents credit exhaustion from spam

## [1.0.0] - 2026-05-20

### Added
- Initial release
- `/gpt`, `/deepseek`, `/exa` commands
- WSL Ubuntu install instructions
