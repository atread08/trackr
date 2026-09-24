/*
  app.js — everything Trackr does on the page.

  How it works: the data lives in a few variables (see "State"). Each render
  function rebuilds one part of the page from those variables. When you click
  something, we change the variables, save them with Store (storage.js), and
  re-render.
*/
(function(){
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const uid = () => Math.random().toString(36).slice(2,10);
const dk = (d=new Date()) => d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const CHECK = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5l3.2 3L13 4.5"/></svg>';

function note(id,msg){ const n=$("#"+id); n.textContent=msg||""; n.hidden=!msg; }
function toast(msg){ const el=$("#toast"); el.textContent=msg; el.hidden=false; clearTimeout(toast.t); toast.t=setTimeout(()=>el.hidden=true,2800); }
const short = d => d.toLocaleTimeString([], {hour:"numeric", minute:"2-digit"});
function dur(ms){ const m=Math.max(0,Math.round(ms/60000)); if(m<60) return m+"m"; const h=Math.floor(m/60), r=m%60; return r?`${h}h ${r}m`:`${h}h`; }
const fmtMin = m => dur(m*60000);
function dueInfo(due){
  if(!due) return null; const d=new Date(due); if(isNaN(d)) return null;
  const ms=d-Date.now(), abs=Math.abs(ms), days=Math.floor(abs/864e5), hrs=Math.floor(abs%864e5/36e5), mins=Math.max(1,Math.floor(abs%36e5/6e4));
  const span = days ? days+"d "+hrs+"h" : hrs ? hrs+"h "+mins+"m" : mins+"m";
  return { ms, sev: ms<864e5 ? "bad" : ms<3*864e5 ? "warn" : "ok", label: ms<0 ? span+" late" : "in "+span,
    when: d.toLocaleString([], {weekday:"short", month:"short", day:"numeric", hour:"numeric", minute:"2-digit"}) };
}

/* ================= State ================= */
let assignments=[], plans={}, parking=[], stats={log:{}, focusLog:{}}, focusId=null;
let showDone=false;
const expanded=new Set();
let confirmDel=null;

/* Load everything saved in this browser (also used when another tab saves). */
function loadAll(){
  assignments=Store.load("assignments", []);
  plans=Store.load("plans", {});
  parking=Store.load("parking", []);
  const s=Store.load("stats", {}); stats={log:s.log||{}, focusLog:s.focusLog||{}};
  focusId=Store.load("focus", null);
}

/* Save one kind of data, and show a note if the browser refused. */
function persist(name, value){
  const res=Store.save(name, value);
  if(res===true) note("hwNote","");
  else note("hwNote", res==="quota_exceeded" ? "Storage is full. Delete some old assignments, then try again." : "This browser isn't letting Trackr save, so changes will be lost when you close the page. Private windows can cause this.");
}
const planOf = id => plans[id] || {steps:[], estMin:0, actualMin:0};
function setPlan(id, p){ plans[id]=p; persist("plans", plans); }
function bump(key, n=1){ const o={...(stats[key]||{})}; const k=dk(); o[k]=(o[k]||0)+n; const ks=Object.keys(o).sort(); while(ks.length>30) delete o[ks.shift()]; stats={...stats,[key]:o}; persist("stats", stats); }
function setFocus(id){ focusId=id||null; persist("focus", focusId); }

/* ================= Assignments model ================= */
const allAssignments = () => assignments;
const score = a => { const i=dueInfo(a.due); return i ? i.ms : 9e15; };
const openAssignments = () => allAssignments().filter(a=>!a.done).sort((a,b)=>score(a)-score(b));
const getA = id => allAssignments().find(a=>a.id===id);
const nextStep = id => planOf(id).steps.find(s=>!s.done);

function updateAssignment(id, changes){
  assignments=assignments.map(a=>a.id===id?{...a, ...changes}:a);
  persist("assignments", assignments);
}
function setDone(a, val){
  if(val){ bump("log"); const p=planOf(a.id); toast(p.estMin && p.actualMin ? `Done! Guessed ${fmtMin(p.estMin)}, took ${fmtMin(p.actualMin)}.` : "Done! That counts."); if(focusId===a.id) setFocus(null); }
  updateAssignment(a.id, {done:val});
  renderAll();
}
function deleteAssignment(id){
  assignments=assignments.filter(a=>a.id!==id);
  persist("assignments", assignments);
  if(plans[id]){ delete plans[id]; persist("plans", plans); }
}

/* ================= Render ================= */
function renderAll(){ renderHeader(); renderNow(); renderHW(); renderPark(); renderStats(); }

const CITIES=[["Los Angeles","America/Los_Angeles"],["New York","America/New_York"],["London","Europe/London"],["Paris","Europe/Paris"],["Shanghai","Asia/Shanghai"],["Sydney","Australia/Sydney"]];
const HOME_TZ="America/New_York";
function tzParts(tz, d){ const o={}; new Intl.DateTimeFormat("en-US",{timeZone:tz,year:"numeric",month:"numeric",day:"numeric",hour:"numeric",minute:"numeric",hourCycle:"h23"}).formatToParts(d).forEach(p=>o[p.type]=+p.value||p.value); return o; }
function tzOffsetMin(tz, d){ const p=tzParts(tz,d); return Math.round((Date.UTC(p.year,p.month-1,p.day,p.hour%24,p.minute)-Math.floor(d.getTime()/60000)*60000)/60000); }
function renderWorld(){
  const now=new Date(), home=tzParts(HOME_TZ,now), homeOff=tzOffsetMin(HOME_TZ,now);
  const homeDay=Date.UTC(home.year,home.month-1,home.day);
  $("#world").innerHTML=CITIES.map(([name,tz])=>{
    const p=tzParts(tz,now), diffH=(tzOffsetMin(tz,now)-homeOff)/60;
    const dayDiff=Math.round((Date.UTC(p.year,p.month-1,p.day)-homeDay)/864e5);
    const isHome=tz===HOME_TZ, hr=p.hour%24, night=hr<7||hr>=20;
    const rel=isHome?"You're here":`${diffH>0?"+":""}${Number.isInteger(diffH)?diffH:diffH.toFixed(1)}h`+(dayDiff>0?" · tomorrow":dayDiff<0?" · yesterday":" · today");
    const time=now.toLocaleTimeString([],{timeZone:tz,hour:"numeric",minute:"2-digit"});
    return `<div class="city ${isHome?"home":""}"><span class="name"><span class="dot ${night?"night":""}" title="${night?"Night":"Day"}"></span>${name}</span><span class="time">${time}</span><span class="rel">${rel}</span></div>`;
  }).join("");
}
function renderHeader(){
  renderWorld();
  const now=new Date(), h=now.getHours();
  $("#greet").innerHTML=(h<12?"Good morning":h<17?"Good afternoon":"Good evening")+", <mark>Austyn</mark>";
  $("#date").textContent=now.toLocaleDateString([], {weekday:"long", month:"long", day:"numeric"});
  $("#clock").textContent=short(now);
  const start=new Date(now); start.setHours(8,0,0,0); const end=new Date(now); end.setHours(24,0,0,0);
  $("#dayFill").style.width=Math.min(100,Math.max(0,(now-start)/(end-start)*100))+"%";
  const left=end-now; $("#dayLeft").textContent=`${Math.floor(left/36e5)}h ${Math.floor(left%36e5/6e4)}m left today`;
  // summary: next due
  const nx=openAssignments().find(a=>dueInfo(a.due));
  if(nx){ const i=dueInfo(nx.due); $("#sNext").textContent=i.label; $("#sNext").style.color=i.sev==="bad"?"var(--bad)":""; $("#sNextWhat").textContent=nx.title+(nx.course?" · "+nx.course:""); }
  else { $("#sNext").textContent="Clear"; $("#sNext").style.color=""; $("#sNextWhat").textContent="Nothing with a due date"; }
}

function renderNow(){
  const el=$("#nowPanel"), a=focusId && getA(focusId);
  const timerHTML=`
    <div class="timer">
      <div class="disc ${timer.running?"":"idle"}" id="disc"><div class="disc-inner"><div><div class="disc-time num" id="discTime"></div><div class="disc-sub" id="discSub"></div></div></div></div>
      <div class="presets" role="group" aria-label="Timer length">${[5,15,25,45].map(m=>`<button class="chip-btn" type="button" data-preset="${m}" aria-pressed="${timer.total===m*60}">${m===5?"5 · just start":m}</button>`).join("")}</div>
      <div class="btnrow" style="justify-content:center">
        <button class="btn ${timer.running?"":"primary"}" type="button" id="tStart">${timer.running?"Pause":(timer.remaining<timer.total?"Resume":"Start focus")}</button>
        <button class="btn ghost" type="button" id="tReset">${timer.remaining<timer.total?"Stop & log":"Reset"}</button>
      </div>
    </div>`;
  if(!a || a.done){
    const picks=openAssignments().slice(0,3);
    el.innerHTML=`
      <div><div class="eyebrow">Right now</div><h2 style="font-size:26px;margin-top:4px">Pick one thing.</h2></div>
      <div class="now-top">
        <div class="pick-list">
          ${picks.length ? picks.map(p=>{ const i=dueInfo(p.due); return `<button class="pick" type="button" data-focus="${esc(p.id)}"><span><strong>${esc(p.title)}</strong><br><span class="muted" style="font-size:14px">${esc(p.course||"No class")}</span></span>${i?`<span class="chip ${i.sev}">${i.label}</span>`:""}</button>`; }).join("")
            + `<p class="step-meta">Your most urgent. Pick one and you only have to look at its next step.</p>`
            : `<p class="empty">Nothing open. Add something below, or enjoy the free time.</p>`}
        </div>
        ${timerHTML}
      </div>`;
  } else {
    const p=planOf(a.id), s=nextStep(a.id), i=dueInfo(a.due), dn=p.steps.filter(x=>x.done).length;
    el.innerHTML=`
      <div class="panel-head"><div class="eyebrow">Right now</div><button class="btn small ghost" type="button" id="unfocus">Switch task</button></div>
      <div class="now-top">
        <div style="display:flex;flex-direction:column;gap:12px;min-width:0">
          <div class="now-task"><strong style="color:var(--ink)">${esc(a.title)}</strong>${a.course?`<span class="chip">${esc(a.course)}</span>`:""}${i?`<span class="chip ${i.sev}">${i.label}</span>`:""}</div>
          ${s ? `
            <div><div class="eyebrow">Next tiny step · ${dn+1} of ${p.steps.length}</div><p class="step-big"><span>${esc(s.text)}</span></p></div>
            <div class="btnrow">
              <button class="btn hl" type="button" data-stepdone="${esc(a.id)}|${s.id}">Done, what's next?</button>
            </div>` : `
            <div><div class="eyebrow">${p.steps.length?"All steps done":"No steps yet"}</div><p class="step-big"><span>${p.steps.length?"Is the whole thing finished?":"What's the very first move?"}</span></p></div>
            <p class="step-meta">${p.steps.length?"If yes, check it off. If not, add the next step.":"Make it tiny and physical, like “open the doc”."}</p>
            <div class="btnrow">
              ${p.steps.length?`<button class="btn hl" type="button" data-toggle="${esc(a.id)}">Mark assignment done</button>`:""}
              <button class="btn ${p.steps.length?"":"primary"}" type="button" data-expand="${esc(a.id)}">Add steps myself</button>
            </div>`}
          ${p.steps.length||p.actualMin?`<p class="step-meta">${dn} of ${p.steps.length} steps done${p.estMin?" · guessed ~"+fmtMin(p.estMin):""}${p.actualMin?" · focused "+fmtMin(p.actualMin)+" so far":""}</p>`:""}
        </div>
        ${timerHTML}
      </div>`;
  }
  paintTimer();
}

let hwDirty=false;
function renderHW(){
  const box=$("#hw");
  // Don't redraw while you're typing a step, or you'd lose what you typed.
  if(box.contains(document.activeElement) && document.activeElement.tagName==="INPUT"){ hwDirty=true; return; }
  hwDirty=false;
  const all=allAssignments();
  const open=all.filter(a=>!a.done).sort((a,b)=>score(a)-score(b));
  const done=all.filter(a=>a.done).sort((a,b)=>score(b)-score(a));
  const rows=showDone?open.concat(done):open;
  $("#hwMeta").textContent = open.length ? `${open.length} open · ${open.filter(a=>{const i=dueInfo(a.due);return i&&i.ms<7*864e5;}).length} due this week` : "All caught up";
  const td=$("#toggleDone"); td.hidden=!done.length; td.textContent=showDone?"Hide finished":`Show finished (${done.length})`;
  box.innerHTML = rows.length ? rows.map(a=>{
    const i=dueInfo(a.due), p=planOf(a.id), n=p.steps.length, d=p.steps.filter(s=>s.done).length, open=expanded.has(a.id), id=esc(a.id);
    return `
    <article class="task ${a.done?"done":""} ${focusId===a.id?"focused":""}">
      <div class="task-row">
        <button class="check ${a.done?"on":""}" type="button" data-toggle="${id}" aria-label="${a.done?"Mark not done":"Mark done"}: ${esc(a.title)}">${a.done?CHECK:""}</button>
        <div style="min-width:0">
          <div class="task-title">${esc(a.title)}</div>
          <div class="task-meta">
            <span class="chip">Added by you</span>
            ${a.course?`<span class="chip">${esc(a.course)}</span>`:""}
            ${i&&!a.done?`<span class="chip ${i.sev}" title="${esc(i.when)}">${i.label}</span>`:""}
            ${i?`<span class="muted">${esc(i.when)}</span>`:""}
            ${p.estMin?`<span class="chip">~${fmtMin(p.estMin)}</span>`:""}
            ${n?`<span class="progress" title="${d} of ${n} steps"><i style="width:${d/n*100}%"></i></span><span class="muted num">${d}/${n}</span>`:""}
          </div>
        </div>
        <div class="task-actions">
          ${!a.done&&focusId!==a.id?`<button class="btn small primary" type="button" data-focus="${id}">Focus</button>`:""}
          <button class="btn small ghost" type="button" data-expand="${id}" aria-expanded="${open}">${open?"Close":"Steps"}</button>
        </div>
      </div>
      ${open?`
      <div class="task-body">
        ${n?`<ul class="steps">${p.steps.map(s=>`<li class="${s.done?"done":""}"><button class="check ${s.done?"on":""}" type="button" data-stepdone="${id}|${s.id}" aria-label="Toggle step">${s.done?CHECK:""}</button><span>${esc(s.text)}</span><button class="btn small ghost" type="button" data-delstep="${id}|${s.id}" aria-label="Delete step">✕</button></li>`).join("")}</ul>`
          :`<p class="empty">Break it into steps small enough that starting feels easy.</p>`}
        <form class="step-form" data-addstep="${id}"><input type="text" id="step-${id}" placeholder="Add a tiny step, e.g. open the rubric" aria-label="New step" maxlength="140"><button class="btn small" type="submit">Add</button></form>
        ${confirmDel===a.id
          ? `<div class="confirm"><span>Delete this assignment?</span><button class="btn small" type="button" data-delyes="${id}" style="color:var(--bad)">Delete</button><button class="btn small ghost" type="button" data-delno="1">Keep</button></div>`
          : `<div><button class="btn small ghost" type="button" data-del="${id}" style="color:var(--bad)">Delete assignment</button></div>`}
      </div>`:""}
    </article>`; }).join("")
  : `<p class="empty">No open assignments.</p>`;
}
$("#hw").addEventListener("focusout", ()=>setTimeout(()=>{ if(hwDirty) renderHW(); }, 150));

function renderPark(){
  $("#parkList").innerHTML = parking.map(p=>`<li><span>${esc(p.text)}</span><button class="btn small ghost" type="button" data-unpark="${esc(p.id)}">Done</button></li>`).join("")
    || `<li class="muted" style="background:transparent;padding:0;font-size:14px">Thoughts you park here wait until your focus session ends.</li>`;
}

function renderStats(){
  const k=dk(), log=stats.log||{}, fl=stats.focusLog||{};
  $("#todayCount").textContent=log[k]||0;
  const days=[]; for(let i=6;i>=0;i--){ const d=new Date(); d.setDate(d.getDate()-i); days.push(log[dk(d)]||0); }
  const max=Math.max(1,...days);
  $("#week").innerHTML=days.map(v=>`<i class="${v?"":"zero"}" style="height:${Math.max(6,v/max*100)}%"></i>`).join("");
  $("#focusToday").textContent=fmtMin(fl[k]||0);
  const pairs=allAssignments().filter(a=>a.done).map(a=>planOf(a.id)).filter(p=>p.estMin && p.actualMin>=5);
  if(pairs.length){
    const r=pairs.reduce((s,p)=>s+p.actualMin,0)/pairs.reduce((s,p)=>s+p.estMin,0);
    $("#estRatio").textContent=r.toFixed(1)+"×";
    $("#estNote").textContent = r>1.15 ? `Things take about ${r.toFixed(1)}× your guess. Multiply new guesses by that.` : r<.85 ? "You finish faster than you guess." : "Your guesses match reality. Nice.";
  } else {
    $("#estRatio").textContent="–";
    $("#estNote").textContent="Finish an assignment with a guess and some timer time to see how your guesses compare.";
  }
}

/* ================= Timer ================= */
const timer={total:25*60, remaining:25*60, endAt:0, running:false, int:null};
let audio=null, wake=null;
function paintTimer(){
  const disc=$("#disc"); if(!disc) return;
  const r=Math.max(0,Math.ceil(timer.remaining));
  $("#discTime").textContent=String(Math.floor(r/60)).padStart(2,"0")+":"+String(r%60).padStart(2,"0");
  disc.style.setProperty("--p", timer.remaining/timer.total);
  $("#discSub").textContent = timer.running ? "ends "+short(new Date(timer.endAt)) : (timer.remaining<timer.total ? "paused" : "minutes");
}
function tick(){
  timer.remaining=(timer.endAt-Date.now())/1000;
  if(timer.remaining<=0){ finish(true); return; }
  paintTimer();
  const s=Math.ceil(timer.remaining); document.title=Math.floor(s/60)+":"+String(s%60).padStart(2,"0")+" · Trackr";
}
function start(){
  try{ audio ||= new (window.AudioContext||window.webkitAudioContext)(); audio.resume(); }catch(e){}
  try{ navigator.wakeLock && navigator.wakeLock.request("screen").then(w=>wake=w).catch(()=>{}); }catch(e){}
  timer.endAt=Date.now()+timer.remaining*1000; timer.running=true;
  clearInterval(timer.int); timer.int=setInterval(tick,250); renderNow();
}
function releaseWake(){ try{ wake && wake.release(); }catch(e){} wake=null; }
function pause(){ timer.running=false; clearInterval(timer.int); timer.remaining=Math.max(0,(timer.endAt-Date.now())/1000); document.title="Trackr"; releaseWake(); renderNow(); }
function finish(complete){
  clearInterval(timer.int);
  const left = timer.running ? Math.max(0,(timer.endAt-Date.now())/1000) : timer.remaining;
  const spent=Math.round((timer.total-left)/60);
  timer.running=false; timer.remaining=timer.total; document.title="Trackr"; releaseWake();
  if(spent>=1){
    bump("focusLog", spent);
    if(focusId){ const p=planOf(focusId); setPlan(focusId, {...p, actualMin:(p.actualMin||0)+spent}); }
  }
  if(complete){ chime(); toast(`${spent} minutes done. Stand up, drink water, take 5.`); }
  else if(spent>=1) toast(`Logged ${spent} min.`);
  renderAll();
}
function chime(){
  if(!audio) return;
  try{ [0,.22,.44].forEach((d,i)=>{ const o=audio.createOscillator(), g=audio.createGain(); o.frequency.value=[660,880,990][i]; o.connect(g); g.connect(audio.destination);
    const t0=audio.currentTime+d; g.gain.setValueAtTime(.0001,t0); g.gain.exponentialRampToValueAtTime(.25,t0+.02); g.gain.exponentialRampToValueAtTime(.0001,t0+.5); o.start(t0); o.stop(t0+.55); }); }catch(e){}
}

/* ================= Events ================= */
document.addEventListener("click", e=>{
  const b=e.target.closest("button"); if(!b) return; const d=b.dataset;
  if(d.preset){ if(timer.running) return toast("Pause the timer to change its length."); timer.total=timer.remaining=+d.preset*60; renderNow(); return; }
  if(b.id==="tStart"){ timer.running?pause():start(); return; }
  if(b.id==="tReset"){ if(timer.running||timer.remaining<timer.total) finish(false); return; }
  if(b.id==="unfocus"){ setFocus(null); renderAll(); return; }
  if(b.id==="toggleDone"){ showDone=!showDone; renderHW(); return; }
  if(d.focus){ setFocus(d.focus); renderAll(); window.scrollTo({top:0, behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"}); return; }
  if(d.toggle){ const a=getA(d.toggle); if(a) setDone(a, !a.done); return; }
  if(d.stepdone){ const [aid,sid]=d.stepdone.split("|"); const p=planOf(aid); const s=p.steps.find(x=>x.id===sid); if(!s) return;
    const steps=p.steps.map(x=>x.id===sid?{...x, done:!x.done}:x); setPlan(aid,{...p, steps});
    if(!s.done){ bump("log"); toast(steps.find(x=>!x.done)?"Nice. Next one's small too.":"Every step done. Finish it off?"); }
    renderAll(); return; }
  if(d.expand){ expanded.has(d.expand)?expanded.delete(d.expand):expanded.add(d.expand); renderHW();
    if(expanded.has(d.expand)){ const inp=document.getElementById("step-"+d.expand); if(inp){ inp.scrollIntoView({block:"center"}); inp.focus(); } } return; }
  if(d.delstep){ const [aid,sid]=d.delstep.split("|"); const p=planOf(aid); setPlan(aid,{...p, steps:p.steps.filter(x=>x.id!==sid)}); renderAll(); return; }
  if(d.del){ confirmDel=d.del; renderHW(); return; }
  if(d.delno){ confirmDel=null; renderHW(); return; }
  if(d.delyes){ const id=d.delyes; confirmDel=null; expanded.delete(id); if(focusId===id) setFocus(null); deleteAssignment(id); renderAll(); return; }
  if(d.unpark){ const id=d.unpark; parking=parking.filter(p=>p.id!==id); persist("parking", parking); renderPark(); return; }
});
document.addEventListener("submit", e=>{
  e.preventDefault(); const f=e.target;
  if(f.id==="addForm"){
    const title=$("#fTitle").value.trim(); if(!title) return;
    const dueStr=$("#fDue").value, est=Math.max(0,parseInt($("#fEst").value,10)||0), course=$("#fCourse").value.trim();
    const id=uid();
    assignments=assignments.concat({id, title, course, due: dueStr ? new Date(dueStr).toISOString() : "", done:false, created:new Date().toISOString()});
    persist("assignments", assignments);
    if(est) setPlan(id, {steps:[], estMin:est, actualMin:0});
    if(!focusId) setFocus(id);
    f.reset(); toast("Added. Open Steps to break it into tiny pieces.");
    renderAll();
    return;
  }
  if(f.id==="parkForm"){
    const v=$("#parkInput").value.trim(); if(!v) return;
    parking=[{id:uid(), text:v, created:new Date().toISOString()}, ...parking];
    persist("parking", parking);
    $("#parkInput").value=""; renderPark(); toast("Parked. Back to it.");
    return;
  }
  if(f.dataset.addstep){
    const aid=f.dataset.addstep, inp=f.querySelector("input"), v=inp.value.trim(); if(!v) return;
    const p=planOf(aid); setPlan(aid, {...p, steps:p.steps.concat({id:uid(), text:v, done:false})});
    inp.value=""; hwDirty=false; inp.blur(); renderAll();
    const again=document.getElementById("step-"+aid); if(again) again.focus();
  }
});

/* ================= Start up ================= */
loadAll();
if(Store.save("focus", focusId)!==true){ // quick check that this browser allows saving
  $("#sync").textContent="Not saving";
  note("hwNote","This browser isn't letting Trackr save, so changes will be lost when you close the page. Private windows can cause this.");
}
Store.onChange(()=>{ loadAll(); renderAll(); }); // another Trackr tab saved something
renderAll();
setInterval(()=>{ renderHeader(); if(!timer.running) renderNow(); renderHW(); }, 30000);
document.addEventListener("visibilitychange", ()=>{ if(!document.hidden){ renderHeader(); if(timer.running) tick(); } });
})();
