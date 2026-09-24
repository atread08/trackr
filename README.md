# Austyn's Projects

My personal site: a home page that lists the things I've built and how long I worked on each one.

## Open it

Double-click `index.html`, or run `open index.html` from Terminal in this folder.

## Add a project or log time

Everything is in `js/projects.js`. You don't need to touch the other files.

- **Log time:** add a line to a project's `log`, e.g.
  `{ date: "2026-09-25", minutes: 45, did: "Added dark mode" },`
- **Add a project:** copy a whole `{ ... }` block in `PROJECTS` and change the details.

The page adds up the time and sessions automatically.

## What's in the folder

```
index.html        the page
css/site.css      the look (the purple colors are at the top)
js/projects.js    your projects and work logs, the file you edit
js/site.js        builds the page from projects.js
```

## Online

This folder is meant to be published with GitHub Pages as `<username>.github.io`. Each project (like Trackr) is its own GitHub repository with Pages turned on, so it shows up at `<username>.github.io/<project>`. Each project's `url` in `projects.js` points there, and `localUrl` is used when you open the page from your Mac.
