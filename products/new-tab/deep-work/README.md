# Deep Work — Aurevia Studio

A calm, distraction-free Chrome New Tab extension for focused productivity.

**Install path:** `products/new-tab/deep-work`

## Features

- Digital clock and date
- Configurable web search (Google, DuckDuckGo, Bing, Ecosia, or custom URL prefix)
- To-do list with add / complete / delete (persisted locally)
- Focus / Pomodoro timer (25 / 5 defaults, start / pause / reset, configurable durations, ring progress)
- Daily goals with progress sliders
- Bookmarks / custom shortcuts
- Daily progress summary (todos + goals)
- Local daily motivational quotes (curated static list — no network API)
- Background: default `assets/background.jpg`, custom image URL, or gradient presets with fallback
- Show / hide dashboard widgets from settings
- Settings panel (gear button or Escape to close)
- Brief loading state, invalid-URL error states, keyboard accessibility, responsive layout

## Install (Chrome)

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select this folder: `products/new-tab/deep-work`
5. Open a new tab to use Deep Work

## Permissions

| Permission | Why |
| --- | --- |
| `storage` | Persist todos, goals, shortcuts, timer state, and settings in `chrome.storage.local` |

No other permissions are requested. There is no background service worker, no remote sync, and no analytics.

## Privacy

All data stays on your device via `chrome.storage.local`. Quotes are bundled locally. Custom background URLs you paste may cause the browser to fetch that image from the host you specify; the extension does not phone home.

## Limitations

- Replaces the Chrome New Tab page while enabled
- Custom background images depend on the remote host remaining available and allowing display
- Timer accuracy depends on the tab remaining open; state is restored on reload
- Search uses a simple URL prefix + encoded query (no engine-specific APIs)
- Not a full task manager — lists are intentionally lightweight

## Brand

- **Palette:** sage `#8FA88A`, warm gray `#2C3530`, soft ivory `#E8E4DC`
- **Mood:** calm, focused, nature-inspired
- **Typography:** Iowan Old Style / Palatino Linotype stacks

## Package layout

```
products/new-tab/deep-work/
├── manifest.json
├── newtab.html
├── newtab.css
├── newtab.js
├── storage.js
├── README.md
├── assets/background.jpg
├── icons/
└── store/
```

## Version

1.0.0 — Manifest V3
