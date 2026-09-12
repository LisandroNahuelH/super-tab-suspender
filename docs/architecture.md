# Architecture

How a tab gets suspended, how it comes back, and where every moving part lives.

## The problem

An inactive tab is not free. Chromium keeps a renderer process, a document, timers and sockets alive for it until memory pressure forces the browser to act. The extension trades that page for a much smaller page it owns, on demand and on a schedule.

## The suspension model

A suspended tab is not a frozen renderer: it is a different page. The extension:

1. stores a record under `suspended-tab:<tabId>` in `chrome.storage.local` (original URL, title, timestamp, optional screenshot);
2. calls `chrome.tabs.update(tabId, { url: 'suspended.html?id=<tabId>' })`;
3. the browser discards the original document and its renderer.

Restoring reverses it: `suspended.html` reads the record, calls `chrome.tabs.update(tabId, { url })`, and deletes the record. If the record is missing, the page says so instead of guessing.

## Runtime surfaces

| Surface | Entry | Role |
|---|---|---|
| Service worker | `src/background.ts` | Alarms, context menu, suspend and restore, record storage, install/update counters |
| Popup | `src/popup.ts` | Settings UI, active-tab preview, manual suspend, open counters |
| Content script | `src/content.ts` | Reports page protection signals (audio, video, form activity) to the worker |
| Restore page | `suspended.html` + `src/suspended.ts` | The page a suspended tab shows, and the restore action |
| Shared helpers | `src/shared/*` | Message lookup, UI language resolution, RTL locale detection, document locale attributes |

Business rules stay in the worker and in pure helpers. The diagnostics feature under `src/features/heartbeat/` is isolated: no tab rules live inside those modules, so the feature can be reasoned about (and audited) on its own.

## Scheduling and protection

Auto-suspension runs on a `chrome.alarms` alarm, because a Manifest V3 service worker is evicted when idle and timers would not survive that. The worker checks the current tab list, skips protected tabs, and suspends the rest. Protection signals come from the content script and from tab state:

| Rule | Source |
|---|---|
| Pinned tab | `chrome.tabs` tab state |
| Playing audio | `tab.audible` |
| Playing video or active form | content-script signal |

Settings live in `chrome.storage.local` and are written by the popup. The selected delay is bounded by the popup UI, and auto-suspension is off until the user enables it.

## Data flow

```
popup or context menu
        |
        v
service worker  --tabs.update-->  suspended.html?id=<tabId>
        |                                  |
        | storage.local:                   | click on the page
        | suspended-tab:<tabId>            |
        |                                  |
        +--------- tabs.update(url) <------+
                   storage.local.remove
```

## Localization

- The canonical catalog is `public/_locales/en/messages.json`; every other locale mirrors its keys. The manifest uses `__MSG_extensionName__`-style placeholders and declares `default_locale: en`.
- Locale metadata (runtime folder, text direction, status) lives in `docs/i18n/chrome-web-store-locales.json`.
- Four audits run in the build chain and in CI; see [docs/i18n.md](i18n.md).

## Anonymous diagnostics

Three events are counted: `install` and `update` (from the worker's `onInstalled` handler) and `ping` (when the popup opens, at most once every 24 hours, throttled through `chrome.storage.local`). The payload and the exact field list are published in [docs/privacy.md](privacy.md). Uninstalls are counted through `chrome.runtime.setUninstallURL`, because Chrome does not run extension code on removal.

## Build and release

| Step | Command | Output |
|---|---|---|
| I18n audits | `npm run i18n:check`, `npm run i18n:audit`, `npm run i18n:audit-literals` | exit code |
| Types | `npm run typecheck` | exit code |
| Tests | `npm run test` | vitest run |
| Bundle | `npm run build` | `dist/` (worker, popup, content script, restore page, locales) |
| Whole gate | `npm run verify` | the four steps above, in order |
| Store package | `npm run package:release` | `release/super-tab-suspender-<version>-chrome-web-store.zip` (PowerShell, Windows) |

`dist/` is what you load unpacked. The Chrome Web Store receives the packaged zip; the store is the distribution channel, and this repository does not ship built artifacts.

## Portability notes

- Suspend and restore logic depends only on `chrome.tabs` and `chrome.storage`, so it is testable without a browser.
- Tests run on happy-dom with a stubbed `chrome` API and a stubbed network: no test reaches a real endpoint (see `src/test-support/no-network.ts`).
- The service worker holds no in-memory state that matters across eviction; every decision reads from storage or from the tabs API.
