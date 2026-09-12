# AGENTS.md - the Super Tab Suspender runbook (read this before touching anything)

You are an agent asked to build, load, verify or update this repository. Follow it top to bottom: layout, exact commands, expected output, and what to do when something fails. It is self-contained.

## 0. What this repository is

- The public source of a Chromium Manifest V3 extension that is published on the Chrome Web Store. The store is the distribution channel; this repository does not ship built artifacts.
- **No installer, by design.** An extension is installed by the browser, not by a script on the host: there is no `install/` folder, no `versions.json` handshake, no scheduler/guardian task, and nothing to patch outside this repository. The two supported routes are the manual path in [README.md](README.md) and this runbook.
- Pull requests are not accepted here (see [CONTRIBUTING.md](CONTRIBUTING.md)); issues are.

Layout in one look:

```
public/            manifest, locales, icons, brand assets
src/               background worker, popup, content script, restore page, heartbeat feature
src/test-support/  test doubles, including the network stub
tools/i18n/        the localization audits and store-copy tools
docs/              architecture, limits, troubleshooting, privacy, i18n
LICENSES/          third-party asset licenses (Montserrat, SIL OFL 1.1)
TRADEMARKS.md      name and mark notices (not license terms)
dist/              build output (git-ignored): the folder you load unpacked
```

## 1. Preflight - verify, then continue or stop

```bash
node --version     # expect v24.x (see .nvmrc)
npm --version      # expect 11.x
git --version      # any 2.x
```

If Node is older than 24, stop and report it. Do not improvise a Node version manager.

## 2. Build and verify

```bash
npm ci             # lockfile-exact install; never 'npm install' here
npm run verify     # localization audits, typecheck, tests, bundle
```

Expected tail: a vitest summary with every test passing, then vite reporting `dist/` files and `built in ...ms`.

`npm run verify` is the same chain CI runs. Do not disable a step to make it pass: fix the cause.

## 3. Load it unpacked

1. Open `chrome://extensions`.
2. Enable *Developer mode*.
3. Choose *Load unpacked* and select the `dist` folder - not the repository root.

`Manifest file is missing or unreadable` means the wrong folder was selected, or `dist/` does not exist yet.

## 4. Smoke test (prove it works, then report)

1. Open any `https` page, right-click, choose *Suspend this tab*. The tab becomes the restore page, showing the site icon and the suspension time.
2. Click the restore page. The original URL comes back and the record disappears.
3. Open the popup: enable automatic suspension, set the smallest delay, open a second tab, wait for the alarm. The background tab suspends.
4. `chrome://extensions` -> the extension's card -> *service worker* -> console: no errors.

Report to the user as a short table: commands run, their result, and whether the smoke test passed.

## 5. Package for the store (Windows only)

```powershell
npm run package:release
```

Output: `release/super-tab-suspender-<version>-chrome-web-store.zip`, built from `dist/`.

**Never upload to the Chrome Web Store from CI or from an agent.** The upload is a human step on the maintainer's machine; this repository ships no credentials and no publish workflow.

## 6. Tests and the network stub

Tests run under happy-dom and load `src/test-support/no-network.ts` through `setupFiles` in `vitest.config.ts`. That file replaces `globalThis.fetch` with a recorder answering `503`, so no test run reaches the diagnostics endpoint. The product's fire-and-forget path (`if (!response.ok) return;`) is what executes.

- If you add a test that must see a network response, stub `fetch` inside that test.
- Never remove the setup file, and never assert against a real endpoint.

## 7. Failure protocol

| Symptom | Meaning | Do |
|---|---|---|
| `npm ci` fails | Lockfile out of sync with `package.json` | Fix `package.json` or regenerate the lockfile deliberately; never `npm install --no-save` as a workaround |
| `i18n:check` fails | A locale catalog diverges from `public/_locales/en/messages.json` | Add the missing keys, remove the extra ones, or fill the empty messages |
| `i18n:audit` fails | A translation equals English and is not in the allow-list | Translate it, or add it to the allow-list with a reason |
| `i18n:audit-literals` fails | Visible copy is hardcoded in a source file | Move it into the catalog and read it through `getMessage` |
| `typecheck` fails | TypeScript error | Read the reported file and line; do not silence with `any`. `TS2882` on a CSS import means `src/vite-env.d.ts` is missing |
| `test` fails | Behavior regression | Reproduce with `npx vitest run <file>` and fix the code, not the assertion |
| `build` fails | Vite error | The message names the file or plugin |
| Extension loads but does nothing | Wrong tab type or a protected tab | See [docs/troubleshooting.md](docs/troubleshooting.md) |

## 8. What you must not do

- Do not upload anything to the Chrome Web Store, and do not add store credentials to the repository or to CI.
- Do not add remote code, analytics SDKs, or new host permissions without updating [docs/privacy.md](docs/privacy.md), [SECURITY.md](SECURITY.md) and the manifest in the same change.
- Do not hardcode secrets. The value in `src/features/heartbeat/constants/heartbeat-api-key.ts` is a public client tag, not a credential; treat any real credential as something that must never enter this repository.
- Do not weaken or skip the localization audits, and do not bypass git hooks.
- Do not commit `dist/`, `release/`, `Backups/` or `.bak-*` files.
- Do not edit localized catalogs to "fix" English wording: edit `en` first, then let the bootstrap tooling propagate keys.

## 9. Manual path (for the user, no agent)

```bash
git clone https://github.com/LisandroNahuelH/super-tab-suspender
cd super-tab-suspender
npm ci
npm run verify
```

Then load `dist/` unpacked as in section 3. To use the published extension instead, install it from the Chrome Web Store listing linked in [README.md](README.md).
