# Súper Tab Suspender

TypeScript Chromium MV3 extension for manually and automatically suspending tabs.

Suspension is represented by a lightweight internal page that keeps the original URL, shows the site favicon, displays the suspension date, and uses a blurred screenshot as the background.

## Development

```powershell
npm install
npm run icons
npm run typecheck
npm run build
```

## Load in Chromium

1. Open `chrome://extensions`.
2. Enable developer mode.
3. Choose `Load unpacked`.
4. Select the `dist` folder.

## Usage

On an `http` or `https` page, right-click and choose `Suspend this tab`.

You can also open the popup from the extension icon and use the `Suspend this tab` button.

The current tab changes to the extension's suspended page. Clicking that page restores the original URL and clears the data saved in `chrome.storage.local`.
