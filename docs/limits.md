# Limits

What this extension guarantees, and where it stops. Read this before filing a bug: several of the entries below are deliberate.

## Platform

- Chromium-based browsers with Manifest V3 support only. There is no Firefox or Safari build.
- The extension needs `http` and `https` tabs to work on. Everything else is out of reach by design:
  - `chrome://`, `about:`, `edge://` and other browser-internal pages;
  - the Chrome Web Store and other extensions' pages;
  - local files, unless the user grants file access to the extension.
- The store package is built with a PowerShell script, so producing a release zip requires Windows. Building, type-checking and testing work on any platform.

## What survives a suspension

| Kept | Lost |
|---|---|
| The tab itself, its position and its title | The rendered page and its in-page state |
| The original URL | Scroll position |
| The site icon and the suspension timestamp | Form input that was not submitted |
| The record in `chrome.storage.local` | Media playback, WebSocket and other live connections |

This is the trade the extension makes: it gives up page state to release the renderer. Protection rules exist so the tabs you actively care about are skipped.

## Protection rules

A tab is skipped when any of these is true:

- it is pinned;
- it is playing audio (`tab.audible`);
- the content script reports active video playback or form activity.

The last two depend on the content script running in the page: pages that block content scripts, or frames the script cannot see into, fall back to the tab-level signals only.

## Automatic suspension

- Off until you enable it in the popup.
- Driven by `chrome.alarms`, which is best-effort: the browser decides when the alarm fires and a sleeping service worker can delay it. Do not expect second-level precision.
- The delay is bounded by the popup's own options, not by a server.
- Suspension is skipped while the browser is closed, because nothing runs.

## Storage

- Records live in `chrome.storage.local`: per browser profile, per device.
- There is no sync between devices, no account, and no cloud copy.
- Clearing the extension's data, or removing the extension, deletes the records. A tab that was suspended will keep showing the restore page and cannot resolve it afterwards.

## Localization

- Supported languages are the folders under `public/_locales`; the per-locale status is tracked in `docs/i18n/chrome-web-store-locales.json`.
- A browser language without a locale folder falls back to English.
- A few strings are intentionally identical across languages (units such as `min`, and the brand link's accessible label); they are listed in the translation audit's allow-list.
- The store listing copy has its own character limits and its own pipeline; see `docs/i18n.md`.

## Anonymous diagnostics

- Three counters exist: install, update and open (throttled to at most once every 24 hours).
- The payload is fixed and published in [docs/privacy.md](privacy.md). There is no opt-out toggle in the UI.
- Delivery is best-effort: a failure is swallowed on purpose (fire-and-forget), so counters under-count offline installs.
- Uninstalls are counted through a farewell page registered with `chrome.runtime.setUninstallURL`; it only counts if the browser shows it.
- Server-side rate limiting for the endpoint is tracked outside this repository. The client value that ships in the extension is a public client tag, not a credential, and grants no access.

## Known non-goals

- Being a session manager, a workspace tool or a tab-group replacement.
- Per-site rules, allow/deny lists, or scheduled suspension windows.
- Suspending tabs on a schedule while the browser is closed.
- Syncing records or settings across devices.
- Any form of remote code: the extension loads only what ships inside its own package.
