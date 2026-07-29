# AGENTS.md — Super Tab Suspender

## Build

- `npm run build` → `dist/`. Reload unpacked extension manually after build.

## Heartbeat (anonymous diagnostics)

- Feature: `src/features/heartbeat/*` → `POST https://www.premium11.com/api/heartbeat` with `X-Heartbeat-Key`.
- Events: `install` / `update` (SW `onInstalled` via `registerHeartbeatOnInstalled`) + `ping` on popup open (24h throttle).
- Payload: `{ v:1, product:'super-tab-suspender', event, extVersion, installId, installChannel, locale, timezone, ts }` — no URLs, tab ids, or page content.
- Storage: `stsInstallId`, `stsLastHeartbeatAt` (`heartbeat-storage-keys.ts`).
- Wire: `registerHeartbeatOnInstalled()` + `registerUninstallFarewellUrl()` in `src/background.ts`; `sendAnonymousHeartbeat('ping')` in `src/popup.ts`.
- Manifest `host_permissions`: `https://www.premium11.com/*`, `https://premium11.com/*`.

## Heartbeat uninstall

- Chrome cannot run SW code on uninstall. Use `chrome.runtime.setUninstallURL` → `https://www.premium11.com/goodbye/super-tab-suspender?id=<uuid>&v=<version>`.
- Wire: `registerUninstallFarewellUrl()` on SW boot + `onInstalled`.
- Site records uninstall on page open and feedback via `POST /api/goodbye` (no `X-Heartbeat-Key`).
- Do not `fetch` on extension remove — it never runs.

## Chrome Web Store

- **Extension ID:** `gkmgfloahebcnfiepanjedmpjnnceggn`
- **Slug (heartbeat / support / goodbye):** `super-tab-suspender`
- **Privacy policy (CWS):** `https://www.premium11.com/en/privacidad` (alias `/privacy`)
- **Admin dashboard:** `https://www.premium11.com/admin`
- Registry CLI: `D:\OfiSync\0. Lisandro\0. Programacion\0. Chrome Web Store Publish\extensions.json`
