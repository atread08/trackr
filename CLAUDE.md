# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Austyn's personal portfolio home page ("Austyn's Projects"), meant to be published as the GitHub Pages user site `<username>.github.io`. The owner is a beginner, so explain changes simply. The sibling folder `~/Desktop/trackr` is a separate project that is published at `/trackr/` from its own repository.

## Running

It's a static site with no build step, and Node isn't installed. Plain `<script>` tags (not ES modules) keep it working from `file://`. Open it with `open index.html`. For a headless screenshot, run Chrome in the background with `--screenshot` and kill it after a few seconds. Chrome's headless window won't go below about 500px wide, so check phone widths by loading the page in a 390px `<iframe>` inside a wrapper page.

## Structure

- `js/projects.js`: the global `PROJECTS` array. This is the only file the owner edits. Each project has `name`, `blurb`, `status`, `url` (web path) and `localUrl` (used when `location.protocol === "file:"`), plus `log: [{date:"YYYY-MM-DD", minutes, did}]`.
- `js/site.js`: renders everything from `PROJECTS`. Each project shows only its name (as the link), status, blurb, total time and session count, all computed from `log`. The owner asked for no card box, chart, tags or visible work log, so don't add them back unless asked.
- `css/site.css`: minimalist by the owner's request. It uses a solid `#744E96` background, a single text color (white) with hierarchy from size and weight only, and one font (DM Sans). There are no gradients, accent colors or light mode. Colors are tokens on `:root`.

Work-log entries should be real. Don't invent times; ask the owner.
