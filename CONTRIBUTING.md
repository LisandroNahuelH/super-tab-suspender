# Contributing

Short version: **issues are welcome, pull requests are not accepted.**

## Issues

Bug reports and feature requests are the contribution channel here, and they are read.

- Bug: use the [bug template](.github/ISSUE_TEMPLATE/bug.yml). Extension version, browser version, operating system, exact steps, expected versus actual, and the service-worker console output if there is one.
- Feature: use the [feature template](.github/ISSUE_TEMPLATE/feature.yml). Describe the problem before the solution.
- Security problems do not belong in an issue: see [SECURITY.md](SECURITY.md).

## Why pull requests are not accepted

This repository is the public source of a published extension. Development happens in the maintainer's workspace, and the version on the Chrome Web Store is built from it. Accepting a merged pull request would split the source of truth between two trees, and the store build would drift from both.

If you want a behaviour changed, open an issue. If it is accepted, the maintainer implements it here, and the store release follows.

## If you fork

The MIT license lets you fork, modify and ship your own build, under two conditions:

- keep the copyright and license notice;
- do not use the Premium11 name or marks for your build (see the trademark notice in [LICENSE](LICENSE)).

Please do not file bugs about forks here: reproduce them against a build from this repository first.

## Repository documentation

- Repository documentation is English only: `README.md`, `AGENTS.md`, `SECURITY.md`, `CHANGELOG.md`, `CONTRIBUTING.md` and everything under `docs/`.
- The extension's own UI copy lives in `public/_locales/<locale>/messages.json`, one file per language. Those files are localized on purpose; see [docs/i18n.md](docs/i18n.md).

## Checks

If you are working on a fork, the whole gate is one command:

```bash
npm ci
npm run verify
```

It runs the localization audits, the type check, the tests and the bundle, in that order. Keep it green: the same chain runs in CI on every push and pull request.
