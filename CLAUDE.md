# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Trackr is a personal study dashboard for a college student (NYU, ADHD-friendly design). It began as a claude.ai Artifact (`reference/trackr-original.html`) and is being turned into a standalone website in phases. The owner is a beginner, so explain changes simply.

- **Phase 1 (current):** plain static site that runs by double-clicking `index.html`. Data is saved in localStorage. Google Calendar, Gmail and the AI features show "coming soon" notes.
- **Later phases:** bring back Calendar/Brightspace, Gmail and AI step breakdowns. The original file still has that code (the "Google wiring" and "Claude breakdowns" sections plus `watchTool` usage), but it used the Claude-only `window.claude` runtime, so it will need real Google APIs or a backend.

## Running and testing

There is no build step, package manager or test suite, and Node is not installed. Plain `<script>` tags are used, not ES modules, so the page works from `file://`. Keep it that way unless a server is introduced on purpose.

- Open: `open index.html`
- Optional local server: `python3 -m http.server 8000` → http://localhost:8000. This is a different localStorage origin from `file://`, so data saved one way doesn't appear the other way.
- Headless check: `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --screenshot=out.png --window-size=1280,1500 file://$PWD/index.html`. Run it in the background and kill it after a few seconds, because the page's `setInterval` clocks stop `--dump-dom` or `--virtual-time-budget` runs from ever exiting.

## Architecture

- `css/styles.css`: all styles. Colors are CSS custom properties on `:root`. Dark mode overrides them under `@media (prefers-color-scheme:dark)` guarded by `:root:not([data-theme="light"])` and again under `:root[data-theme="dark"]`. Keep all three token sets in sync. The top block holds base rules the artifact wrapper used to supply (`[hidden]` → `display:none!important`, `body{margin:0}`). Some components set `display` themselves, so `hidden` breaks without those rules.
- `js/storage.js`: global `Store` with `load(name, fallback)`, `save(name, value)` and `onChange(cb)`. `save` returns `true` or an error code (`"quota_exceeded"` or `"unavailable"`). The keys are `trackr.assignments` (array), `trackr.plans` (object keyed by assignment id: `{steps:[{id,text,done}], estMin, actualMin}`), `trackr.parking` (array, newest first), `trackr.stats` (`{log, focusLog}`, daily counts trimmed to 30 days) and `trackr.focus` (id or null).
- `js/app.js`: one IIFE. Module-level state is loaded by `loadAll()`. Each change updates state, calls `persist(name, value)`, which saves and shows a note in `#hwNote` on failure, and then re-renders. `renderX()` functions rebuild panels with template strings. Escape interpolated text with `esc()`. `renderHW()` skips redrawing while a step input inside `#hw` has focus (`hwDirty`) so typing isn't lost. A `storage` event listener reloads state when another tab saves.
- Calendar, Inbox and the summary tiles that need Google data are static "coming soon" markup in `index.html`. The JS no longer touches them.

The greeting name, `HOME_TZ` and the `CITIES` world clocks are hard-coded in `app.js`.
