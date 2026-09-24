/*
  site.js — builds the home page from the PROJECTS list in projects.js.
  You shouldn't need to edit this file to add projects or log time.
*/
(function(){
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function hm(min){ const h=Math.floor(min/60), m=Math.round(min%60); return h ? (m ? `${h}h ${m}m` : `${h}h`) : `${m}m`; }

// Opened as a file on this Mac? Use the local link; on the website, use the web link.
const linkFor = p => location.protocol === "file:" && p.localUrl ? p.localUrl : p.url;

// Add up a project's work log
function summarize(p){
  const log = p.log || [];
  return { total: log.reduce((n,s) => n + s.minutes, 0), sessions: log.length };
}

function card(p){
  const s = summarize(p), link = linkFor(p);
  const stats = [
    ["Time", s.total ? hm(s.total) : "–"],
    ["Sessions", s.sessions],
  ];
  return `
  <article class="project">
    <h2>${link ? `<a href="${esc(link)}">${esc(p.name)} <span aria-hidden="true">→</span></a>` : esc(p.name)}</h2>
    ${p.status ? `<p class="status">${esc(p.status)}</p>` : ""}
    <p class="blurb">${esc(p.blurb)}</p>
    <dl class="stats">${stats.map(([k,v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
  </article>`;
}

function render(){
  const all = PROJECTS.map(summarize);
  const total = all.reduce((n,s) => n + s.total, 0), sessions = all.reduce((n,s) => n + s.sessions, 0);
  $("#totals").innerHTML = [
    ["Projects", PROJECTS.length],
    ["Time building", total ? hm(total) : "–"],
    ["Sessions", sessions],
  ].map(([k,v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("");
  $("#projects").innerHTML = PROJECTS.map(card).join("");
  $("#year").textContent = new Date().getFullYear();
}

render();
})();
