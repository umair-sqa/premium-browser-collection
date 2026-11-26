# DevSpace — Aurevia Studio

Engineering-focused Chrome New Tab dashboard: clock, configurable search, curated GitHub shortcuts, bookmarks, code snippets, notes, workspace links, and developer tools — all stored locally.

## Install (unpacked)

1. Open Chrome and go to `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this folder:

   ```
   products/new-tab/devspace
   ```

5. Open a new tab to use DevSpace.

To update after pulling changes, use **Reload** on the extension card.

## Privacy

- Data is stored only in `chrome.storage.local` on your device.
- No analytics, accounts, or remote sync.
- No credentials, tokens, or passwords are requested or collected.
- Search opens Google or DuckDuckGo in the browser; DevSpace does not proxy queries.
- There is **no live GitHub API**. GitHub links are static curated URLs (`github.com`, notifications, pulls, issues). An optional username only builds profile/repos page URLs — it never authenticates or fetches data.

## Features

| Widget | Notes |
| --- | --- |
| Clock & date | Local time, updates every second |
| Search | Google or DuckDuckGo (settings) |
| GitHub shortcuts | Static curated links + optional username → profile/repos URLs |
| Bookmarks | Name + URL, persisted locally |
| Snippets | Title, language tag, body; add / edit / delete / copy |
| Notes | Textarea with autosave |
| Workspace | Label + URL shortcuts (e.g. localhost) |
| Dev tools | Static curated: MDN, Stack Overflow, caniuse, npm, etc. |
| Custom links | Extra name + URL list |
| Settings | Show/hide widgets; Escape closes; keyboard accessible |

## Limitations

- Not a GitHub client: no notifications counts, PR status, or repository lists from the API.
- Offline preview without the Chrome extension APIs falls back to in-memory defaults (changes may not persist until loaded as an extension).
- Requires Chrome Manifest V3 (or Chromium equivalent) with `storage` permission.
- Does not include remote scripts, CDNs, or bundled ZIP archives.

## Package contents

- `manifest.json` — MV3 new-tab override
- `newtab.html` / `newtab.css` / `newtab.js` — dashboard UI
- `storage.js` — defaults and `chrome.storage.local` helpers
- `assets/background.jpg` — atmosphere background
- `icons/icon-{16,32,48,128}.png`
- `store/` — store listing artwork (screenshot, promo)

## Brand

**Aurevia Studio — DevSpace**  
Palette: `#0D1117`, `#58A6FF`, `#21262D`
