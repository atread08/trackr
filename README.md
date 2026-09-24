# Trackr

A study dashboard: assignments broken into tiny steps, a focus timer, a parking lot for stray thoughts, and stats on how it's going.

## Open it

Double-click `index.html`. It opens in your default browser. That's it, since there's nothing to install or build.

Or, from Terminal in this folder:

```sh
open index.html
```

Your data (assignments, steps, parking lot, stats) saves automatically in that browser's **localStorage**. That means:

- It stays on this Mac, in that one browser. Chrome and Safari each keep their own copy.
- Always open Trackr the same way. A copy opened from a different place (for example, a local web server) starts empty.
- Clearing your browser's history or site data for files erases it. Private windows don't keep it.

## What's in the folder

```
index.html              the page itself (layout and text)
css/styles.css          how it looks (colors, fonts, spacing, dark mode)
js/storage.js           saving and loading from localStorage
js/app.js               everything the page does
reference/trackr-original.html   the original Claude artifact version (includes the Google + AI code)
```

## Roadmap

- **Phase 1 (done):** runs on your Mac, saves locally. Google Calendar, Gmail, and Claude step breakdowns show a "coming soon" note.
- **Later:** bring back Google Calendar/Brightspace, Gmail, and AI step breakdowns. `reference/trackr-original.html` has the original code for these.
