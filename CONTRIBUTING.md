# Contributing to Bot Horizon

Thanks for wanting to contribute! 🙌 Bot Horizon is an **open source** project with a clear review flow so all code is checked before it lands.

## How to contribute

### 1. Report bugs 🐛

Open an **[Issue](https://github.com/DakkuaDev/hermes-bot-horizon/issues/new?template=bug_report.yml)** with:

- Steps to reproduce
- Expected vs. actual behavior
- Screenshot if applicable
- Hermes Desktop version and OS

### 2. Suggest features 💡

Open an **[Issue](https://github.com/DakkuaDev/hermes-bot-horizon/issues/new?template=feature_request.yml)** describing the idea and why you want it.

### 3. Submit code 🧑‍💻

1. **Fork** the repo
2. Create a branch: `git checkout -b feat/short-name` or `fix/short-name`
3. Make your changes (with clear comments!)
4. **Test** that the plugin still works (see below)
5. Open a **Pull Request** to `main` describing what changes and why

## Review rules 🔒

- **Nothing merges to `main` without a reviewed PR** by the maintainer
- PRs must pass the CI checks
- UI changes must include before/after screenshots
- Keep the plugin in a **single `plugin.js` file** whenever possible (simple install)
- **No personal or hardcoded data**: the plugin must work for anyone with their own bots

## Quick tests

```bash
# Frontend syntax check
node --check desktop/bot-horizon/plugin.js

# Backend tests (ledger, streak, pets)
python3 tests/bv_ledger_test.py
python3 tests/bv_streak_test.py
python3 tests/bv_pets_test.py
```

## Attribution

When modifying or distributing, **keep attribution to the original author** (see [LICENSE](LICENSE)).
