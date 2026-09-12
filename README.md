<div align="center">

# Super Tab Suspender

**Free the RAM an idle tab is holding, without losing the tab.**

A Chromium extension (Manifest V3) that swaps an inactive tab for a lightweight restore page. The page keeps the original URL and title, shows the site icon, and brings the real tab back on one click.

`License: MIT` · `Platform: Chromium (Manifest V3)` · `Built with TypeScript + Vite`

[![ci](https://github.com/LisandroNahuelH/super-tab-suspender/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/LisandroNahuelH/super-tab-suspender/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/github/license/LisandroNahuelH/super-tab-suspender)](LICENSE)

**Install from the Chrome Web Store:** [Super Tab Suspender](https://chromewebstore.google.com/detail/super-tab-suspender/gkmgfloahebcnfiepanjedmpjnnceggn)

</div>

---

## What it is

Every background tab you forget about keeps a full renderer alive: memory, timers, sockets. Super Tab Suspender replaces that tab with the extension's own static page, so the browser can release the renderer. The tab stays where it was, in the tab strip, with its favicon and title.

| Feature | What it does |
|---|---|
| Manual suspend | Suspend the current tab from the popup or the right-click menu |
| Automatic suspension | Suspend inactive background tabs after a delay you choose |
| Protection rules | Never suspend pinned tabs, tabs playing audio or video, or tabs with a half-filled form |
| Restore page | A lightweight local page that keeps the original URL, shows the site icon and the suspension time, and restores the tab on click |
| Localized UI | The popup and the restore page follow the browser language |

## How it works

A suspended tab is not a frozen renderer: it is a different, much smaller page. The extension records the original URL in `chrome.storage.local`, points the tab at `suspended.html`, and the browser is free to drop the original page. Clicking the restore page writes the URL back into the tab and deletes the record.

```
popup / context menu
        |
        v
service worker  --tabs.update-->  suspended.html?id=<tabId>
        |                                  |
        | chrome.storage.local             | click
        | suspended-tab:<tabId> = {url,title,ts,screenshot}
        |                                  |
        +---------- tabs.update(url) <-----+
                    storage.local.remove
```

## What is inside

| # | Piece | What it is | Where it lands |
|---|---|---|---|
| 1 | Service worker | Schedules auto-suspension, owns the context menu, performs suspend and restore | `dist/background.js` |
| 2 | Popup | Controls, current-tab preview, manual suspend button | `dist/popup.html` |
| 3 | Content script | Reports page-protection signals (audio, video, form activity) to the worker | `dist/content.js` |
| 4 | Restore page | The light page a suspended tab shows | `dist/suspended.html` |
| 5 | Locales | Extension UI copy per browser language | `dist/_locales/<locale>/messages.json` |
| 6 | Anonymous diagnostics | Install, update and open events, counted server-side | built into the worker and the popup |

## Quick start

From the Chrome Web Store: open the [listing](https://chromewebstore.google.com/detail/super-tab-suspender/gkmgfloahebcnfiepanjedmpjnnceggn) and choose *Add to Chrome*. Nothing else to configure: automatic suspension is off until you turn it on.

From source:

```bash
git clone https://github.com/LisandroNahuelH/super-tab-suspender
cd super-tab-suspender
npm ci
npm run verify
```

Then open `chrome://extensions`, enable *Developer mode*, choose *Load unpacked*, and select the `dist` folder.

Agents: follow [AGENTS.md](AGENTS.md). It is the runbook written for that job, and it ends with a verification checklist.

## Requirements

- A Chromium-based browser with Manifest V3 support (Chrome, Edge, Brave, Opera, Vivaldi).
- To build from source: Node 24 or newer and npm (see `.nvmrc`).
- The packaging script uses PowerShell and therefore runs on Windows only; building and testing work everywhere.

## Security & trust

The extension asks for five permissions and two host permissions, and nothing else:

| Permission | Why |
|---|---|
| `tabs` | Read the tab list to suspend and restore the right tab |
| `storage` | Keep the suspended-tab records and your settings locally |
| `alarms` | Run the auto-suspension check on a schedule |
| `contextMenus` | Add the *Suspend this tab* menu entry |
| `activeTab` | Act on the tab you are looking at when you use the popup |
| `https://www.premium11.com/*` | Send the anonymous install/update/open counters and the uninstall page |

There is no remote code, no analytics SDK, and no page content ever leaves the machine. The only network calls are the anonymous counters described in [docs/privacy.md](docs/privacy.md). Audit the claim yourself:

```bash
git grep -n "fetch(" -- src          # the single network call site
git grep -n "host_permissions" -A4 -- public/manifest.json
npm run verify                        # audits, typecheck, tests, build
```

## Limits (honest ones)

- Only `http` and `https` tabs can be suspended. `chrome://` pages, the Web Store, and other extension pages cannot.
- A suspended tab loses everything a reload loses: scroll position, unsent form input, in-page state. That is the point, and it is why protection rules exist.
- Records live in `chrome.storage.local`: they do not sync between devices and they are gone if you clear extension data.
- Automatic suspension is off by default. The delay is configurable, but the check runs on a service-worker alarm, so it is best-effort, not exact to the second.
- Anonymous counters are best-effort and there is no opt-out toggle in the UI. The exact payload is published in [docs/privacy.md](docs/privacy.md).
- No Firefox or Safari build. More edges in [docs/limits.md](docs/limits.md).

## Uninstall

Open `chrome://extensions`, find *Super Tab Suspender*, and choose *Remove*. The extension's storage is deleted with it.

A tab that is suspended while you remove the extension keeps showing the restore page, because that page is just a local URL. Open the original URL by hand if you still need it; the record is gone.

Chrome cannot run extension code at uninstall time, so the extension registers a farewell page with `chrome.runtime.setUninstallURL`. It loads only if the browser shows it, and it only counts the uninstall.

## Documentation

| Doc | For |
|---|---|
| [`AGENTS.md`](AGENTS.md) | agents that build, load or verify this repo |
| [`docs/architecture.md`](docs/architecture.md) | how suspension, restore and scheduling work |
| [`docs/limits.md`](docs/limits.md) | what is guaranteed, and the edges |
| [`docs/troubleshooting.md`](docs/troubleshooting.md) | symptoms, probes, recovery |
| [`docs/privacy.md`](docs/privacy.md) | the exact diagnostics payload and how to verify it |
| [`docs/i18n.md`](docs/i18n.md) | the locale catalog and the audit tooling |
| [`CHANGELOG.md`](CHANGELOG.md) | released versions |
| [`SECURITY.md`](SECURITY.md) | permissions, reporting, out of scope |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | what is welcome here (issues yes, pull requests no) |

## Screenshots

Screenshots and the store description live on the [Chrome Web Store listing](https://chromewebstore.google.com/detail/super-tab-suspender/gkmgfloahebcnfiepanjedmpjnnceggn). This repository keeps the source, not the listing assets.

## FAQ

<details><summary>Where does my data live?</summary>

In `chrome.storage.local`, inside your browser profile: the suspended-tab records, your auto-suspension settings, a random install id, and the last time the popup sent a counter. Nothing is uploaded except the counters in [docs/privacy.md](docs/privacy.md).

</details>

<details><summary>Does suspending lose my page?</summary>

The page is unloaded, like a reload. The URL, the title and the time are kept and the tab comes back to that URL. Scroll position and half-written forms are not kept, which is why pinned, playing and form-active tabs are protected by default.

</details>

<details><summary>Is the extension sending my browsing history anywhere?</summary>

No. URLs, titles, tab counts and page content are never sent. The payload is a fixed set of fields listed in [docs/privacy.md](docs/privacy.md), and the service worker can be inspected in DevTools to confirm it.

</details>

<details><summary>How do I verify what the extension does?</summary>

Read `src/features/heartbeat/` (the only code that talks to the network), run `npm run verify` to reproduce the CI chain, and watch the service worker's Network tab while you open the popup.

</details>

<details><summary>Can I use it on Firefox?</summary>

No build is published for it. The code targets the Chromium Manifest V3 APIs.

</details>

<details><summary>Something is broken. Where do I report it?</summary>

Open an issue with the [bug template](.github/ISSUE_TEMPLATE/bug.yml): extension version, browser version, exact steps and what the service-worker console says.

</details>

## Credits

Built by [@LisandroNahuelH](https://github.com/LisandroNahuelH). MIT licensed: the code is free to reuse and adapt, and the [trademark notice](TRADEMARKS.md) still applies to the Premium11 name and marks.

Issues are welcome; pull requests are not accepted, in line with [CONTRIBUTING.md](CONTRIBUTING.md).
