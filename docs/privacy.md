# Privacy: what the extension sends, and how to verify it

This page mirrors the code in `src/features/heartbeat/`. If the two ever disagree, the code is right and this file is a bug.

## What is sent

Three events exist: `install` and `update` (sent once by the service worker when the extension is installed or updated) and `ping` (sent when the popup opens, at most once every 24 hours).

| Field | Value | Why |
|---|---|---|
| `v` | `1` | Payload version, so old clients stay readable |
| `product` | `super-tab-suspender` | Which extension the event belongs to |
| `event` | `install` / `update` / `ping` | Which counter to increment |
| `extVersion` | the extension version | Adoption of a release |
| `installId` | a random UUID generated on first run | Count unique installs without an account |
| `installChannel` | how the extension was installed | Store versus unpacked, for support |
| `locale` | the browser UI language | Which languages to prioritize |
| `timezone` | the browser timezone | Rough geographic distribution |
| `ts` | the client timestamp | When the event happened |

The endpoint is `POST https://www.premium11.com/api/heartbeat`, with the header `X-Heartbeat-Key`. The response may contain `{"throttled": true}`, which tells the client to skip its next popup ping.

## What is NOT sent

- No URLs, page titles, tab counts, or tab ids.
- No page content, form data, keystrokes or screenshots.
- No cookies, no browsing history, no file system access.
- No advertising identifiers, and no third-party analytics SDK.

Two honest caveats:

1. As with any HTTP request, the server sees the source IP address of the request. Retention and handling of that are covered by the site's own [privacy policy](https://www.premium11.com/en/privacidad).
2. The reported identity is pseudonymous, not anonymous: the random install id is stable over time. It is not linked to an account and it is generated locally.

## Uninstall

Chrome does not run extension code when an extension is removed, so the extension registers a farewell page with `chrome.runtime.setUninstallURL`:

```
https://www.premium11.com/goodbye/super-tab-suspender?id=<installId>&v=<version>
```

That page loads only if the browser shows it, and it is what records the uninstall.

## The client value is not a credential

`X-Heartbeat-Key` carries a static value that ships inside every published build of the extension; it is a soft anti-spam tag for the counter endpoint, not an authentication secret, and it grants no access to any data or capability. Publish it, read it, or ignore it: the security of the endpoint cannot depend on it. Server-side rate limiting and de-duplication live in the site's own codebase, not here.

## How to verify

1. Watch the network from the extension side:
   - `chrome://extensions` -> the extension's card -> *service worker* -> *Network*.
   - Filter by `premium11`.
   - Open the popup: you should see at most one request per 24 hours, with the payload above.
2. Watch the source instead:

```bash
git grep -rn "fetch(" -- src
git grep -rn "host_permissions" -A4 -- public/manifest.json
```

The first command lists the only network call site in the project. The second shows the only hosts the extension is allowed to talk to.

3. Inspect what is stored locally:

```js
// in the service-worker console
chrome.storage.local.get(null).then(console.log);
```

You should see your settings, one record per suspended tab, the random install id, and the timestamp of the last popup counter. To make the tool forget everything, clear the extension's data or remove the extension.

## Compatibility with store policy

The extension's use of information received from Google APIs adheres to the Chrome Web Store User Data Policy, including the Limited Use requirements. The counters described here are the extension's own diagnostics, not Google API data.
