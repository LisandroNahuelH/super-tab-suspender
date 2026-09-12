# Troubleshooting

Symptom first. Every probe is a command you can run, or a browser page you can open.

## The build or the gate fails

```bash
npm ci
npm run verify
```

`npm run verify` is the same chain CI runs: the i18n audits, the type check, the tests and the bundle. Read the first failing step:

| Failing step | Usual cause |
|---|---|
| `i18n:check` | A locale catalog is missing a key, has an extra key, or has an empty message |
| `i18n:audit` | A translation is identical to English and is not in the allow-list |
| `i18n:audit-literals` | Visible copy was hardcoded in a source file instead of a catalog |
| `typecheck` | A TypeScript error; the compiler prints file and line |
| `test` | A vitest failure; the report names the file and the assertion |
| `build` | Vite failed; the message names the plugin or the file |

## The extension does not load

Open `chrome://extensions`, enable *Developer mode*, choose *Load unpacked*, and select the `dist` folder - not the repository root.

`Manifest file is missing or unreadable` means the wrong folder was selected. Build first: `npm run build`.

## Suspension does nothing

Check, in order:

1. Is the tab `http` or `https`? Browser-internal pages and the Web Store cannot be suspended.
2. Is the tab protected? Pinned, playing audio or video, or holding form activity.
3. For automatic suspension: is the toggle on in the popup, and did the delay elapse?
4. The service worker may be asleep. Open the popup once and retry; a Manifest V3 worker is woken by events.

Watch the worker while you reproduce:

1. `chrome://extensions` -> the extension's card -> *service worker*.
2. In the DevTools window that opens, keep the *Console* tab visible.

## The restore page says the record is missing

The record was deleted or never written: extension data was cleared, the profile changed, or the extension was reinstalled.

The page knows the tab id, not the URL. There is nothing to recover from the extension side; open the original URL by hand.

## Restore does not navigate

1. Look for errors in the service-worker console: permission problems, or a tab that no longer exists, surface there.
2. Run this in the worker console to inspect what is stored:

```js
chrome.storage.local.get(null).then((all) => console.log(Object.keys(all), all));
```

3. Stale records (`suspended-tab:*` keys whose tab is gone) are harmless; they are ignored and can be removed by clearing the extension's data.

## The UI is in the wrong language

The popup and the restore page follow the browser's UI language. A language without a locale folder falls back to English. The supported set and its status are in `docs/i18n/chrome-web-store-locales.json`; see `docs/i18n.md` for how to add one.

## Files look modified but nothing changed

On Windows, a checkout with CRLF line endings reports phantom modifications. The repository pins `* text=auto eol=lf` in `.gitattributes`, so this should not happen; if it does, renormalize once:

```bash
git add --renormalize .
```

## Counters look wrong or missing

The diagnostics calls are fire-and-forget: failures are swallowed by design, and the popup event is throttled to once per 24 hours. Nothing to fix in the extension; see [docs/privacy.md](privacy.md) for the payload and how to watch a call.

## Reporting a bug

Open an issue with the [bug template](../.github/ISSUE_TEMPLATE/bug.yml) and include:

- the extension version (from `chrome://extensions`);
- the browser name and version, and the operating system;
- the exact steps, in order, and what you expected instead;
- the service-worker console output, and any failing step of `npm run verify` if the problem is in the build.

Do not paste tokens, personal data or full `chrome.storage` dumps.
