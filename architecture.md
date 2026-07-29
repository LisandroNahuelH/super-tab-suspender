# Architecture — Super Tab Suspender

MV3 extension: service worker suspends inactive tabs to a local `suspended.html` surface; popup controls auto-suspend and manual suspend.

## Runtime surfaces

| Surface | Entry | Role |
| --- | --- | --- |
| Service worker | `src/background.ts` | Alarms, context menu, tab suspend/restore, storage of suspended metadata |
| Popup | `src/popup.ts` | Settings UI, active tab preview, heartbeat ping |
| Content | `src/content.ts` | Page protection signals to SW |
| Suspended page | `suspended.html` | Frozen tab UX + restore |

## Premium11 diagnostics

```
SW onInstalled → heartbeat install|update
Popup open     → heartbeat ping (24h throttle)
SW boot        → setUninstallURL → /goodbye/super-tab-suspender
```

Product slug `super-tab-suspender` must match Premium11 `lib/stats/products.ts` allowlist. Install id in `chrome.storage.local` (`stsInstallId`).

## Portability note

Suspend/restore logic lives in the SW and pure helpers; heartbeat is isolated under `src/features/heartbeat/` with no tab business rules inside those modules.
