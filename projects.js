/*
  projects.js — the list of projects shown on the home page.

  To add a project, copy one { ... } block and change the details.
  To log time you spent, add a line to that project's "log":
    { date: "2026-09-25", minutes: 45, did: "What you worked on" },
  The page adds up your time and sessions for you.
*/
const PROJECTS = [
  {
    name: "Trackr",
    blurb: "A study dashboard that breaks assignments into tiny steps, with a focus timer, a parking lot for stray thoughts, and stats on how it's going.",
    status: "Phase 1 of 2 done",
    url: "/trackr/",                    // where it lives on the website
    localUrl: "../trackr/index.html",   // where it lives on this Mac
    log: [
      { date: "2026-09-23", minutes: 20, did: "Turned the Claude artifact into a real website that saves on its own, and set up git" },
    ],
  },
];
