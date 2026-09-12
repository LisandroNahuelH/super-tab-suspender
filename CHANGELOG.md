# Changelog

All notable changes to this extension, newest first. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Dates are the dates the version was prepared in this repository.

## 0.2.11 - 2026-07-29

First public release of this repository.

**Added**

- Anonymous diagnostics: `install` and `update` counters from the service worker, and a popup `ping` throttled to once every 24 hours. The payload is published in [docs/privacy.md](docs/privacy.md).
- Uninstall counter through `chrome.runtime.setUninstallURL`, because Chromium does not run extension code on removal.
- Repository documentation set: [README.md](README.md), [docs/architecture.md](docs/architecture.md), [docs/limits.md](docs/limits.md), [docs/troubleshooting.md](docs/troubleshooting.md), [docs/privacy.md](docs/privacy.md), [docs/i18n.md](docs/i18n.md), [SECURITY.md](SECURITY.md), [CONTRIBUTING.md](CONTRIBUTING.md) and this changelog.
- Continuous integration: `.github/workflows/ci.yml` runs the same chain as `npm run verify` on every push and pull request, with no secrets and no store uploads.
- The popup brand mark is now a link to the product site.

**Changed**

- The test setup replaces `fetch` with a recorder, so no test run reaches the diagnostics endpoint.

## 0.2.10 - 2026-07-21

**Added**

- Chrome Web Store package produced from the branded UI.

**Changed**

- Popup and restore page adopt the product brand: brand tokens, Montserrat with local font files, and the green scrollbar treatment.
- Fixed Montserrat loading inside the extension (asset base path and body font).

## 0.2.7 - 0.2.9

Localization pipeline and store copy.

- Locale catalogs and the store-copy generator were introduced and audited in this range.
- These builds predate the commit history of this repository; the published versions are listed on the Chrome Web Store.
