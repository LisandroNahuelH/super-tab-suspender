# Architecture

Canonical design document: **[docs/architecture.md](docs/architecture.md)** - suspension model, runtime surfaces, scheduling, storage keys, localization and diagnostics. Read that one; this file stays as a pointer so the two cannot drift.

Repository-local working notes that do not belong in the public design document:

- Build output `dist/` is what gets loaded unpacked; `npm run verify` is the single gate before packaging.
- Packaging (`npm run package:release`) is PowerShell-only and produces a store zip under `release/`, which is git-ignored.
- The agent-facing runbook lives in [AGENTS.md](AGENTS.md); public limits, troubleshooting and privacy notes live under [docs/](docs/).
