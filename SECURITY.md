# Security policy and threat model

## What this extension can reach

| Permission | Why it exists |
|---|---|
| `tabs` | Read the tab list so it can suspend and restore the right tab |
| `storage` | Keep your settings and the suspended-tab records locally |
| `alarms` | Run the auto-suspension check on a schedule |
| `contextMenus` | Add the *Suspend this tab* entry |
| `activeTab` | Act on the tab you are looking at when you use the popup |
| `https://www.premium11.com/*`, `https://premium11.com/*` | Send the anonymous counters and load the farewell page on uninstall |

Nothing else. No file system access, no cookies, no clipboard, no remote code, no analytics SDK.

## What it sends

Only the anonymous counters described in [docs/privacy.md](docs/privacy.md): install, update, and a popup open at most once every 24 hours. No URLs, titles, tab ids, page content, or form data. The single network call site is `src/features/heartbeat/send-anonymous-heartbeat.ts`.

## What is not a credential

The `X-Heartbeat-Key` value that ships in `src/features/heartbeat/constants/heartbeat-api-key.ts` is a public client tag. It is present in every published build, it grants no access to data or capabilities, and the endpoint must not treat it as authentication. Server-side rate limiting and de-duplication belong to the endpoint's own codebase.

## Guarantees

1. **No remote code.** Everything the extension executes is inside the package the store signed; there are no dynamic imports from the network and no `eval` of fetched content.
2. **Local-first records.** Suspended-tab records never leave `chrome.storage.local`.
3. **Reproducible build.** `npm ci` plus `npm run verify` reproduces the CI chain from the committed lockfile: audits, type check, tests, bundle.
4. **Tests cannot call out.** The test setup replaces `fetch` with a recorder, so no test run reaches a real endpoint.

## Reporting a vulnerability

Use GitHub's private reporting: open the repository's **Security** tab and choose *Report a vulnerability*. Include the extension version, the browser version, the steps, and the impact you see.

Do not open a public issue for a vulnerability, and do not include personal data in a report.

## Out of scope

- Chromium itself, and browser APIs that behave unexpectedly: report those upstream.
- Third-party builds of this code. Verify you are installing from the official store listing or building from this repository.
- The `premium11.com` service: the extension ships this repository's code only. Anything server-side is maintained in its own codebase and covered by its own policy.
- Cosmetic issues in the store listing.
