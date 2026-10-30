/* =====================================================================
   THE DISAPPEARING PLAYOFF ENFORCER
   NHL playoff fights, 2021-22 through 2025-26.

   Sections
     1. DATA            real data, generated from the project spreadsheets
     2. HELPERS         formatting, tooltip, trading card reveal, shared team filter
     3. VIEWS           one builder per chart (D3)
     4. SCROLL ENGINE   IntersectionObserver that swaps views as steps scroll
   ===================================================================== */

/* ---------------------------------------------------------------------
   1. DATA
   seasons : fights listed by HockeyFights.com vs fights itemized here
   fights  : one record per fight (per = period, sec = seconds elapsed)
   skaters : every skater with 5+ playoff games in the window
             (gp, toi = minutes per game, pim, pts, f = fights, teams)
   enforcers: the four players named in the "mirage" step
   --------------------------------------------------------------------- */
const DATA = {
  timeline: [
    { season: "2021-22", bouts: 9 },
    { season: "2022-23", bouts: 13 },
    { season: "2023-24", bouts: 4 },
    { season: "2024-25", bouts: 2 },
    { season: "2025-26", bouts: 4 }
  ],
  actualFighters: [
    { name: "Matthew Tkachuk", team: "FLA", points: 24, pim: 35, rinkX: 520, rinkY: 180 },
    { name: "Steven Stamkos", team: "TBL", points: 19, pim: 22, rinkX: 490, rinkY: 280 },
    { name: "Evander Kane", team: "EDM", points: 13, pim: 37, rinkX: 180, rinkY: 225 },
    { name: "Brandon Hagel", team: "TBL", points: 18, pim: 26, rinkX: 540, rinkY: 330 },
    { name: "Tom Wilson", team: "WSH", points: 8, pim: 28, rinkX: 230, rinkY: 140 }
  ],
  edgeRinkPaths: [
    { d: "M 100 225 Q 350 80 600 225", speed: "24.94 MPH" },
    { d: "M 600 225 Q 350 370 100 225", speed: "22.87 MPH" }
  ],
  allFights: [
    { date: "04/24/26", matchup: "V. Podkolzin (EDM) vs. J. Viel (ANA)", winner: "Vasily Podkolzin" },
    { date: "04/21/26", matchup: "M. Kastelic (BOS) vs. L. Stanley (BUF)", winner: "Mark Kastelic" },
    { date: "06/09/25", matchup: "D. Nurse (EDM) vs. J. Gadjovich (FLA)", winner: "Jonah Gadjovich" },
    { date: "05/12/25", matchup: "N. Hague (VGK) vs. T. Frederic (EDM)", winner: "Nicolas Hague" },
    { date: "05/08/24", matchup: "D. Pastrnak (BOS) vs. M. Tkachuk (FLA)", winner: "Matthew Tkachuk" },
    { date: "04/26/24", matchup: "E. Kane (EDM) vs. A. Englund (LAK)", winner: "Evander Kane" },
    { date: "05/10/23", matchup: "N. Hague (VGK) vs. D. Nurse (EDM)", winner: "Nicolas Hague" },
    { date: "05/07/23", matchup: "S. Noesen (CAR) vs. E. Haula (NJD)", winner: "Stefan Noesen" },
    { date: "06/20/22", matchup: "L. O'Connor (COL) vs. R. Colton (TBL)", winner: "Logan O'Connor" },
    { date: "06/09/22", matchup: "S. Stamkos (TBL) vs. A. Lafrenière (NYR)", winner: "Steven Stamkos" }
  ]
};

```

const TEAMS = {
  ANA: "Anaheim Ducks", BOS: "Boston Bruins", BUF: "Buffalo Sabres", CAR: "Carolina Hurricanes",
  CGY: "Calgary Flames", COL: "Colorado Avalanche", DAL: "Dallas Stars", EDM: "Edmonton Oilers",
  FLA: "Florida Panthers", LAK: "Los Angeles Kings", MTL: "Montreal Canadiens", NJD: "New Jersey Devils",
  NYI: "New York Islanders", NYR: "New York Rangers", OTT: "Ottawa Senators", TBL: "Tampa Bay Lightning",
  TOR: "Toronto Maple Leafs", VGK: "Vegas Golden Knights", WPG: "Winnipeg Jets", WSH: "Washington Capitals"
};
// Logos load from the NHL's public asset host. If one fails, the button shows the team code instead.
const LOGO_URL = abbr => `https://assets.nhle.com/logos/nhl/svg/${abbr}_light.svg`;
const POS = { L: "Left wing", R: "Right wing", C: "Center", D: "Defense" };

/* ---------------------------------------------------------------------
   2. HELPERS
   --------------------------------------------------------------------- */
const REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const SEASONS = DATA.seasons.map(d => d.s);
const state = { team: null, season: null, step: -1 };

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const ord = n => ["", "1st", "2nd", "3rd"][n];
const fmtDate = iso => new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
const shortDate = iso => new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const fightHasTeam = (f, t) => !t || f.t1 === t || f.t2 === t;
const initials = n => n.split(" ").filter(Boolean).map(p => p[0]).slice(0, 2).join("");
const median = a => { const s = [...a].sort((x, y) => x - y), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
const share = (a, fn) => a.filter(fn).length / a.length;

// Summary numbers used in captions and story copy, computed from DATA so text can never drift from the charts.
const STATS = (() => {
  const all = DATA.skaters, fi = all.filter(d => d.f > 0), F = DATA.fights;
  const lateThird = F.filter(f => f.per === 3 && f.sec >= 16 * 60).length;
  return {
    total: F.length,
    listedTotal: DATA.seasons.reduce((a, s) => a + s.listed, 0),
    pending: DATA.seasons.reduce((a, s) => a + (s.listed - s.itemized), 0),
    nF: fi.length, nAll: all.length,
    fToi: median(fi.map(d => d.toi)), bToi: median(all.map(d => d.toi)),
    fUnder: fi.filter(d => d.toi < 12).length,
    fUnderPct: share(fi, d => d.toi < 12), bUnderPct: share(all, d => d.toi < 12),
    fPim: median(fi.map(d => d.pim / d.gp)), bPim: median(all.filter(d => !d.f).map(d => d.pim / d.gp)),
    fStars: fi.filter(d => d.pts / d.gp >= 0.8).length,
    fD: share(fi, d => d.pos === "D"), bD: share(all, d => d.pos === "D"),
    first: F.filter(f => f.per === 1).length, second: F.filter(f => f.per === 2).length,
    third: F.filter(f => f.per === 3).length, late: lateThird
  };
})();

function fillStats() {
  $$("[data-stat]").forEach(el => {
    const v = STATS[el.dataset.stat], fmt = el.dataset.fmt;
    el.textContent = fmt === "1" ? v.toFixed(1) : fmt === "2" ? v.toFixed(2) : fmt === "pct" ? Math.round(v * 100) + "%" : v;
  });
}

/* ---- tooltip -------------------------------------------------------- */
const tip = $("#tooltip");
function placeTip(x, y) {
  const pad = 14, r = tip.getBoundingClientRect();
  let left = x + pad, top = y + pad;
  if (left + r.width > innerWidth - 8) left = x - r.width - pad;
  if (top + r.height > innerHeight - 8) top = y - r.height - pad;
  tip.style.left = Math.max(8, left) + "px";
  tip.style.top = Math.max(8, top) + "px";
}
function showTip(html, x, y) { tip.innerHTML = html; tip.hidden = false; placeTip(x, y); }
function hideTip() { tip.hidden = true; }
// Wire hover + keyboard focus + touch to any D3 selection.
function bindTip(selection, htmlFn) {
  selection
    .on("mouseenter mousemove", (e, d) => showTip(htmlFn(d), e.clientX, e.clientY))
    .on("mouseleave blur", hideTip)
    .on("focus", (e, d) => { const b = e.currentTarget.getBoundingClientRect(); showTip(htmlFn(d), b.x + b.width / 2, b.y); });
}

/* ---- trading card reveal (opens when a fight is clicked) ----------- */
// Approximate primary and secondary team colors, used for placeholder cards.
const TEAM_COLORS = {
  ANA: ["#F47A38", "#111111"], BOS: ["#FFB81C", "#111111"], BUF: ["#002654", "#FCB514"], CAR: ["#CC0000", "#111111"],
  CGY: ["#D2001C", "#FAAF19"], COL: ["#6F263D", "#236192"], DAL: ["#006847", "#111111"], EDM: ["#041E42", "#FF4C00"],
  FLA: ["#C8102E", "#041E42"], LAK: ["#111111", "#A2AAAD"], MTL: ["#AF1E2D", "#192168"], NJD: ["#CE1126", "#111111"],
  NYI: ["#00539B", "#F47D30"], NYR: ["#0038A8", "#CE1126"], OTT: ["#C52032", "#111111"], TBL: ["#002868", "#FFFFFF"],
  TOR: ["#00205B", "#FFFFFF"], VGK: ["#B4975A", "#333F42"], WPG: ["#041E42", "#004C97"], WSH: ["#C8102E", "#041E42"]
};
const PIM_NOTE = "*PIM is the player's total playoff penalty minutes across the five postseasons, 2021-22 to 2025-26. It is not the minutes from this fight.";
const norm = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const cardModal = $("#card-modal");
const cardFor = (f, side) => { const id = side === 1 ? f.c1 : f.c2; return { id, ...(DATA.cards[id] || {}) }; };

// Black or white text, whichever reads better on a team color.
function readableOn(hex) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? "#111111" : "#ffffff";
}

// PLACEHOLDER CARD: this image stands in for every card that has no art of its own yet
// (no link for it in cards.json), in both the pop-up and the card deck. Save the file at this
// path, or change the path. A small "Card art coming" tag is laid over it so it reads as a
// stand-in. If the file can't be loaded, the drawn card below is used instead.
const PLACEHOLDER_CARD = "images/2021-22_CGY_Matthew-Tkachuk.png";

function placeholderCard(c) {
  const who = `${c.name || "this player"}${c.team ? ", " + (TEAMS[c.team] || c.team) : ""}`;
  return `<div class="tcard-art tcard-art-ph">
    <img class="ph-img" src="${esc(PLACEHOLDER_CARD)}" alt="Placeholder trading card. Card art for ${esc(who)} is coming." draggable="false" data-card-id="${esc(c.id || "")}">
    <span class="ph-soon" aria-hidden="true">Card art coming</span>
  </div>`;
}
// Image errors do not bubble, so listen in the capture phase for a placeholder that fails to load.
document.addEventListener("error", e => {
  const img = e.target;
  if (!(img instanceof HTMLImageElement) || !img.classList.contains("ph-img")) return;
  const art = img.closest(".tcard-art");
  if (art) art.outerHTML = drawnPlaceholder({ id: img.dataset.cardId, ...(DATA.cards[img.dataset.cardId] || {}) });
}, true);

// Backup stand-in, drawn in the team's colors, used only if the placeholder image is missing.
function drawnPlaceholder(c) {
  const [c1, c2] = TEAM_COLORS[c.team] || ["#001f33", "#99e2e0"];
  c = { ...c, name: c.name || "Player" };
  const last = c.name.split(" ").slice(1).join(" ") || c.name;
  return `<div class="tcard-art tcard-ph" role="img" aria-label="Placeholder card for ${esc(c.name)}, ${esc(TEAMS[c.team] || c.team)}" style="--tc:${c1};--tc2:${c2};--tcfg:${readableOn(c1)}">
    <span class="ph-code" aria-hidden="true">${c.team}</span>
    <span class="ph-oval" aria-hidden="true"><b>${esc(initials(c.name))}</b></span>
    <span class="ph-plate" aria-hidden="true">${esc(last)}</span>
    <span class="ph-soon" aria-hidden="true">Card art coming</span>
  </div>`;
}
function tcardHTML(c, f) {
  const art = c.img
    ? `<div class="tcard-art"><img class="tcard-img" src="${esc(c.img)}" alt="${esc(c.alt || `Trading card: ${c.name}, ${TEAMS[c.team] || c.team}, ${f.s}`)}"></div>`
    : placeholderCard(c);
  const win = norm(c.name) === norm(f.w);
  return `<article class="tcard">
    ${win ? `<span class="tcard-win">Fan-vote winner</span>` : ""}
    ${art}
    <dl class="tcard-info">
      <div><dt>Name</dt><dd class="nm">${esc(c.name)}</dd></div>
      <div><dt>Team</dt><dd>${esc(TEAMS[c.team] || c.team)}</dd></div>
      <div><dt>Position</dt><dd>${esc(POS[c.pos] || c.pos || "Not listed")}</dd></div>
      <div><dt>Number</dt><dd>${c.num ? "#" + esc(c.num) : "Not yet added"}</dd></div>
      <div><dt>PIM*</dt><dd>${c.pim ?? "Not listed"}</dd></div>
    </dl>
  </article>`;
}
function openFightCard(f) {
  $("#card-modal-title").textContent = `${f.p1} vs. ${f.p2}`;
  $("#card-modal-sub").textContent = `${fmtDate(f.date)}, ${ord(f.per)} period, ${f.t} elapsed`;
  $("#card-pair").innerHTML = tcardHTML(cardFor(f, 1), f) + tcardHTML(cardFor(f, 2), f);
  // If a linked image fails to load, swap in the placeholder card instead of a broken image.
  $$("#card-pair .tcard").forEach((el, i) => {
    const img = $("img.tcard-img", el);
    if (img) img.addEventListener("error", () => { img.closest(".tcard-art").outerHTML = placeholderCard(cardFor(f, i + 1)); });
  });
  const pct = Math.round(f.pct * 100);
  $("#card-vote").textContent = `${pct}% of fan voters picked ${f.w}${pct < 50 ? ", with many calling it even" : ""}. Fight rating ${f.rt.toFixed(1)} from ${f.v} votes.`;
  $("#card-video").href = f.url;
  $("#pim-note").textContent = PIM_NOTE;
  hideTip();
  if (typeof cardModal.showModal === "function") cardModal.showModal(); else cardModal.setAttribute("open", "");
  $(".modal-body", cardModal).scrollTop = 0;
}
// Close on the X button or a click on the backdrop. Escape is handled by the dialog itself.
cardModal.addEventListener("click", e => { if (e.target === cardModal || e.target.closest(".modal-close")) cardModal.close(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") hideTip(); });

// cards.json (made from Player_Card_Images.xlsx) adds jersey numbers and card image links.
function loadCardOverrides() {
  return fetch("cards.json", { cache: "no-cache" })
    .then(r => (r.ok ? r.json() : {}))
    .then(o => Object.entries(o).forEach(([id, v]) => { if (DATA.cards[id]) Object.assign(DATA.cards[id], v); }))
    .catch(() => {});
}

/* ---- shared team filter (the rink logos drive it) ------------------ */
const refreshers = [];
const EAST = ["BOS", "BUF", "CAR", "FLA", "MTL", "NJD", "NYI", "NYR", "OTT", "TBL", "TOR", "WSH"];
const teamFights = t => DATA.fights.filter(f => fightHasTeam(f, t));

function setTeam(team) {
  state.team = team;
  $$(".rink-team").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.team === team)));
  $("#rink-teams").classList.toggle("has-pick", !!team);
  $("#clear-team").hidden = !team;
  const n = team ? teamFights(team).length : 0;
  $("#filter-status").textContent = team
    ? `Highlighting ${TEAMS[team] || team} (${n} fight${n === 1 ? "" : "s"}) in every chart`
    : "No team selected. Pick one on the rink to highlight its fights in every chart.";
  renderRinkDetail();
  refreshers.forEach(fn => fn());
}

/* ---------------------------------------------------------------------
   3. VIEWS
   --------------------------------------------------------------------- */

/* ---- View: rink (team logos on an NHL rink; click to flip) --------- */
// Rink geometry is in feet, from the NHL rulebook: 200 x 85 ft, 28 ft corner radius,
// goal lines 11 ft from the end boards, blue lines 75 ft from the end boards,
// faceoff circles 15 ft in radius. Line widths are slightly exaggerated so they read on screen.
const RINK_VB = { x: -2, y: -2, w: 204, h: 89 };

function drawRink(svg) {
  const defs = svg.append("defs");
  defs.append("clipPath").attr("id", "rink-clip").append("rect").attr("x", 0).attr("y", 0).attr("width", 200).attr("height", 85).attr("rx", 28);
  svg.append("rect").attr("class", "rink-ice").attr("x", 0).attr("y", 0).attr("width", 200).attr("height", 85).attr("rx", 28);

  const g = svg.append("g").attr("clip-path", "url(#rink-clip)");
  g.append("rect").attr("class", "rink-red").attr("x", 99.5).attr("y", 0).attr("width", 1).attr("height", 85);          // center red line
  [75, 124].forEach(x => g.append("rect").attr("class", "rink-blue").attr("x", x).attr("y", 0).attr("width", 1).attr("height", 85)); // blue lines
  [10.9, 188.9].forEach(x => g.append("rect").attr("class", "rink-red").attr("x", x).attr("y", 0).attr("width", 0.25).attr("height", 85)); // goal lines

  svg.append("circle").attr("class", "rink-ring-blue").attr("cx", 100).attr("cy", 42.5).attr("r", 15);
  svg.append("circle").attr("class", "rink-dot-blue").attr("cx", 100).attr("cy", 42.5).attr("r", 0.8);
  [[31, 20.5], [31, 64.5], [169, 20.5], [169, 64.5]].forEach(([x, y]) => {
    svg.append("circle").attr("class", "rink-ring-red").attr("cx", x).attr("cy", y).attr("r", 15);
    svg.append("circle").attr("class", "rink-dot-red").attr("cx", x).attr("cy", y).attr("r", 1);
  });
  [[80, 20.5], [80, 64.5], [120, 20.5], [120, 64.5]].forEach(([x, y]) => svg.append("circle").attr("class", "rink-dot-red").attr("cx", x).attr("cy", y).attr("r", 1));

  // Goal creases (6 ft radius) and nets (6 ft wide, 4 ft deep)
  svg.append("path").attr("class", "rink-crease").attr("d", "M11,36.5 A6,6 0 0 1 11,48.5 Z");
  svg.append("path").attr("class", "rink-crease").attr("d", "M189,48.5 A6,6 0 0 1 189,36.5 Z");
  svg.append("rect").attr("class", "rink-net").attr("x", 7).attr("y", 39.5).attr("width", 4).attr("height", 6);
  svg.append("rect").attr("class", "rink-net").attr("x", 189).attr("y", 39.5).attr("width", 4).attr("height", 6);

  svg.append("rect").attr("class", "rink-boards").attr("x", 0).attr("y", 0).attr("width", 200).attr("height", 85).attr("rx", 28);
  svg.append("text").attr("class", "rink-conf").attr("x", 50).attr("y", 7).attr("text-anchor", "middle").text("Eastern Conference");
  svg.append("text").attr("class", "rink-conf").attr("x", 150).attr("y", 7).attr("text-anchor", "middle").text("Western Conference");
}

function buildRink() {
  const svg = d3.select("#svg-rink").attr("viewBox", `${RINK_VB.x} ${RINK_VB.y} ${RINK_VB.w} ${RINK_VB.h}`);
  drawRink(svg);

  // Teams are placed by conference, not by where fights happened: East left of center ice, West right.
  const teams = [...new Set(DATA.fights.flatMap(f => [f.t1, f.t2]))].sort();
  const place = (list, xs) => {
    const rows = Math.ceil(list.length / xs.length);
    return list.map((t, i) => ({ t, x: xs[i % xs.length], y: 42.5 + (Math.floor(i / xs.length) - (rows - 1) / 2) * 20 }));
  };
  const spots = place(teams.filter(t => EAST.includes(t)), [24, 44, 64, 84])
    .concat(place(teams.filter(t => !EAST.includes(t)), [116, 136, 156, 176]));

  $("#rink-teams").innerHTML = spots.map(({ t, x, y }) => {
    const n = teamFights(t).length, name = TEAMS[t] || t;
    const w = Math.min(9, 4.6 + 1.5 * Math.sqrt(n));          // logo width, % of the rink
    return `<button type="button" class="rink-team" data-team="${t}" aria-pressed="false"
        aria-label="${esc(name)}, ${n} fight${n === 1 ? "" : "s"}" title="${esc(name)}: ${n} fight${n === 1 ? "" : "s"}"
        style="left:${((x - RINK_VB.x) / RINK_VB.w * 100).toFixed(2)}%;top:${((y - RINK_VB.y) / RINK_VB.h * 100).toFixed(2)}%;width:${w.toFixed(2)}%">
      <span class="flip">
        <span class="face front"><img src="${LOGO_URL(t)}" alt="" loading="lazy"><span class="logo-fallback" aria-hidden="true">${t}</span></span>
        <span class="face back" aria-hidden="true"><b>${n}</b><i>fight${n === 1 ? "" : "s"}</i></span>
      </span>
    </button>`;
  }).join("");

  $$("#rink-teams img").forEach(img => {
    const fail = () => img.closest(".front").classList.add("nologo");
    img.addEventListener("error", fail);
    if (img.complete && img.naturalWidth === 0) fail();
  });
  $("#rink-teams").addEventListener("click", e => {
    const b = e.target.closest(".rink-team");
    if (b) setTeam(state.team === b.dataset.team ? null : b.dataset.team);
  });
  $("#clear-team").addEventListener("click", () => setTeam(null));
  $("#rink-detail").addEventListener("click", e => {
    const b = e.target.closest(".mini-fight");
    if (b) openFightCard(DATA.fights.find(f => f.id === b.dataset.id));
  });
}

// Who dropped the mitts: players from the selected team, then that team's fights.
function renderRinkDetail() {
  const el = $("#rink-detail"), t = state.team;
  if (!t) { el.innerHTML = `<p class="rink-prompt">Click a team logo to flip it and see who dropped the mitts.</p>`; return; }
  const fs = teamFights(t).sort((a, b) => (a.date < b.date ? 1 : -1));
  const players = {};
  fs.forEach(f => [[f.p1, f.t1], [f.p2, f.t2]].forEach(([p, tt]) => { if (tt === t) players[p] = (players[p] || 0) + 1; }));
  const names = Object.entries(players).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  el.innerHTML = `
    <h4>${esc(TEAMS[t] || t)}: ${fs.length} fight${fs.length === 1 ? "" : "s"}</h4>
    <p class="roster">${names.map(([n, c]) => `<span class="player-chip">${esc(n)}${c > 1 ? ` <b>\u00d7${c}</b>` : ""}</span>`).join("")}</p>
    <ul class="mini-log">${fs.map(f => {
      const mine = f.t1 === t ? f.p1 : f.p2, opp = f.t1 === t ? [f.p2, f.t2] : [f.p1, f.t1];
      return `<li><button type="button" class="mini-fight" data-id="${f.id}">${shortDate(f.date)}: ${esc(mine)} vs. ${esc(opp[0])} (${opp[1]})</button></li>`;
    }).join("")}</ul>`;
}

/* ---- View: decline (unit chart, one dot per fight) ------------------ */
let declineDots, declineAnimated = false;
function buildDecline() {
  const svg = d3.select("#svg-decline");
  const W = 760, H = 430, m = { t: 30, r: 20, b: 52, l: 20 };
  const R = 10, STEP = 24, base = H - m.b;
  svg.attr("viewBox", `0 0 ${W} ${H}`);
  const x = d3.scaleBand().domain(SEASONS).range([m.l, W - m.r]).padding(0.3);

  svg.append("line").attr("class", "baseline").attr("x1", m.l).attr("x2", W - m.r).attr("y1", base + 4).attr("y2", base + 4);

  const dots = [];
  DATA.seasons.forEach((s, si) => {
    const fs = DATA.fights.filter(f => f.s === s.s).sort((a, b) => (a.date < b.date ? -1 : 1));
    for (let i = 0; i < s.listed; i++) dots.push({ s: s.s, i, si, f: fs[i] || null });
    const cx = x(s.s) + x.bandwidth() / 2;
    svg.append("text").attr("class", "col-count").attr("x", cx).attr("text-anchor", "middle")
      .attr("y", base - 2 * R - (s.listed - 1) * STEP - 8).text(s.listed);
    svg.append("text").attr("class", "col-label").attr("x", cx).attr("text-anchor", "middle").attr("y", base + 30).text(s.s);
  });

  declineDots = svg.selectAll("g.fight-dot").data(dots).join("g")
    .attr("class", d => "fight-dot" + (d.f ? "" : " pending"))
    .attr("transform", d => `translate(${x(d.s) + x.bandwidth() / 2},${base - R - d.i * STEP})`)
    .attr("tabindex", 0)
    .attr("role", d => (d.f ? "button" : "img"))
    .attr("aria-label", d => d.f ? `${d.f.p1} versus ${d.f.p2}, ${shortDate(d.f.date)}. Open trading cards.` : `Fight listed by HockeyFights.com, details not yet collected, ${d.s}`)
    .on("click", (e, d) => { if (d.f) openFightCard(d.f); })
    .on("keydown", (e, d) => { if (d.f && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openFightCard(d.f); } });
  // Wyman-style badge: a solid disc with a ring inside it. Uncollected fights are an empty dashed disc.
  declineDots.append("circle").attr("class", "disc").attr("r", R);
  declineDots.filter(d => d.f).append("circle").attr("class", "ring").attr("r", R * 0.5);

  bindTip(declineDots, d => d.f
    ? `<strong>${esc(d.f.p1)} vs. ${esc(d.f.p2)}</strong><br>${shortDate(d.f.date)}, ${ord(d.f.per)} period<br><em>Click to see the trading cards</em>`
    : `<strong>Not itemized yet</strong><br>HockeyFights.com lists this fight, but it is not in this dataset.`);

  refreshers.push(() => {
    declineDots
      .classed("hit", d => !!(state.team && d.f && fightHasTeam(d.f, state.team)))
      .classed("dim", d => !!(state.team && !(d.f && fightHasTeam(d.f, state.team))));
  });
}
function enterDecline() {
  if (declineAnimated) return;
  declineAnimated = true;
  if (REDUCE) return;
  // One orchestrated moment: dots drop in season by season.
  declineDots.attr("opacity", 0).transition().delay(d => d.si * 260 + d.i * 40).duration(280).attr("opacity", 1);
}

/* ---- View: mirage (guess, then reveal) ------------------------------ */
const fightsFor = name => DATA.fights.filter(f => f.p1 === name || f.p2 === name).length;
function buildMirage() {
  const wrap = $("#enforcer-cards");
  wrap.innerHTML = DATA.enforcers.map(p => `
    <div class="enf-card">
      <div class="monogram" aria-hidden="true">${esc(initials(p.n))}</div>
      <div>
        <strong>${esc(p.n)}</strong>
        <span class="enf-meta">${POS[p.pos] || p.pos}, ${p.gp} playoff games, ${p.pim} PIM*</span>
        <span class="enf-fights" data-n="${fightsFor(p.n)}">Fights in the log: ?</span>
      </div>
    </div>`).join("");

  const slider = $("#guess"), out = $("#guess-out"), lock = $("#lock-guess"), reset = $("#reset-guess"), result = $("#guess-result");
  slider.addEventListener("input", () => { out.textContent = slider.value; });

  lock.addEventListener("click", () => {
    const total = DATA.enforcers.reduce((a, p) => a + fightsFor(p.n), 0);
    const games = DATA.enforcers.reduce((a, p) => a + p.gp, 0);
    const g = +slider.value;
    $$(".enf-fights", wrap).forEach(el => { el.textContent = `Fights in the log: ${el.dataset.n}`; });
    $$(".enf-card", wrap).forEach(el => el.classList.add("revealed"));
    result.textContent = `You guessed ${g}. The log shows ${total}. Together, these four played ${games} playoff games over five seasons.`;
    slider.disabled = true; lock.hidden = true; reset.hidden = false; reset.focus();
  });
  reset.addEventListener("click", () => {
    $$(".enf-fights", wrap).forEach(el => { el.textContent = "Fights in the log: ?"; });
    $$(".enf-card", wrap).forEach(el => el.classList.remove("revealed"));
    result.textContent = "";
    slider.disabled = false; lock.hidden = false; reset.hidden = true; lock.focus();
  });
}

/* ---- View: regulars (ice time vs penalty minutes) ------------------- */
let regDots;
function buildRegulars() {
  const svg = d3.select("#svg-regulars");
  const W = 760, H = 430, m = { t: 24, r: 24, b: 56, l: 60 }, YMAX = 3;
  svg.attr("viewBox", `0 0 ${W} ${H}`);
  const sk = DATA.skaters.map(d => ({ ...d, y: d.pim / d.gp }));
  const x = d3.scaleLinear().domain(d3.extent(sk, d => d.toi)).nice().range([m.l, W - m.r]);
  const y = d3.scaleLinear().domain([0, YMAX]).range([H - m.b, m.t]);
  const cy = d => y(Math.min(d.y, YMAX));

  // Shaded "enforcer zone": the minutes range where the classic tough guy plays.
  svg.append("rect").attr("class", "zone").attr("x", x(x.domain()[0])).attr("y", m.t)
    .attr("width", x(12) - x(x.domain()[0])).attr("height", H - m.b - m.t);
  svg.append("text").attr("class", "zone-label").attr("x", x(x.domain()[0]) + 8).attr("y", m.t + 16).text("Under 12 min a night");

  svg.append("g").attr("class", "axis").attr("transform", `translate(0,${H - m.b})`).call(d3.axisBottom(x).ticks(6).tickSizeOuter(0));
  svg.append("g").attr("class", "axis").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(6).tickSizeOuter(0));
  svg.append("text").attr("class", "axis-title").attr("x", (m.l + W - m.r) / 2).attr("y", H - 14).attr("text-anchor", "middle").text("Average minutes on ice per game");
  svg.append("text").attr("class", "axis-title").attr("transform", "rotate(-90)").attr("x", -(m.t + H - m.b) / 2).attr("y", 16).attr("text-anchor", "middle").text("Penalty minutes per game");

  const others = sk.filter(d => !d.f), fighters = sk.filter(d => d.f);
  svg.selectAll("circle.dot-other").data(others).join("circle").attr("class", "dot-other")
    .attr("cx", d => x(d.toi)).attr("cy", cy).attr("r", 3.2);
  regDots = svg.selectAll("circle.dot-fighter").data(fighters).join("circle").attr("class", "dot-fighter")
    .attr("cx", d => x(d.toi)).attr("cy", cy).attr("r", 5.5).attr("tabindex", 0)
    .attr("aria-label", d => `${d.n}, ${d.f} fight${d.f > 1 ? "s" : ""}`);
  bindTip(regDots, d => `<strong>${esc(d.n)}</strong><br>${POS[d.pos] || d.pos}, ${d.gp} playoff games<br>${d.toi.toFixed(1)} min/game, ${d.y.toFixed(2)} PIM/game<br>${d.f} fight${d.f > 1 ? "s" : ""} in the log`);

  // Label the three most-penalized fighters so there is something to hold on to.
  svg.selectAll("text.dot-label").data([...fighters].sort((a, b) => b.y - a.y).slice(0, 3)).join("text")
    .attr("class", "dot-label").attr("x", d => x(d.toi) + 9).attr("y", d => cy(d) + 4).text(d => d.n);

  const clamped = sk.filter(d => d.y > YMAX).length;
  $("#regulars-note").textContent = clamped
    ? `Penalty minutes per game = total playoff PIM* divided by playoff games played. ${clamped} skaters above ${YMAX} per game are drawn at the top edge. Skaters with fewer than 5 playoff games are left out.`
    : "Penalty minutes per game = total playoff PIM* divided by playoff games played. Skaters with fewer than 5 playoff games are left out.";

  refreshers.push(() => {
    regDots
      .classed("hit", d => !!(state.team && d.teams.includes(state.team)))
      .classed("dim", d => !!(state.team && !d.teams.includes(state.team)));
  });
}

/* ---- View: clock (when in the game fights happen) ------------------- */
let clockDots;
function buildClock() {
  const svg = d3.select("#svg-clock");
  const W = 760, H = 440, m = { t: 16, r: 24, b: 48, l: 88 };
  const laneH = (H - m.t - m.b) / 3, R = 8;
  svg.attr("viewBox", `0 0 ${W} ${H}`);
  const x = d3.scaleLinear().domain([0, 20]).range([m.l, W - m.r]);
  const laneTop = i => m.t + i * laneH, laneBase = i => laneTop(i) + laneH - 14;

  [0, 1, 2].forEach(i => {
    svg.append("rect").attr("class", "lane-bg").attr("x", m.l).attr("y", laneTop(i) + 2).attr("width", W - m.l - m.r).attr("height", laneH - 4);
    svg.append("text").attr("class", "lane-label").attr("x", m.l - 10).attr("y", laneBase(i) - 4).attr("text-anchor", "end").text(`${ord(i + 1)} period`);
    svg.append("line").attr("class", "lane-line").attr("x1", m.l).attr("x2", W - m.r).attr("y1", laneBase(i)).attr("y2", laneBase(i));
  });
  // Final four minutes of regulation.
  svg.append("rect").attr("class", "final-band").attr("x", x(16)).attr("y", laneTop(2) + 2).attr("width", x(20) - x(16)).attr("height", laneH - 4);
  svg.append("text").attr("class", "band-label").attr("x", x(16) + 6).attr("y", laneTop(2) + 18).text("Last 4 minutes");

  svg.append("g").attr("class", "axis").attr("transform", `translate(0,${H - m.b + 4})`)
    .call(d3.axisBottom(x).tickValues([0, 5, 10, 15, 20]).tickSizeOuter(0));
  svg.append("text").attr("class", "axis-title").attr("x", (m.l + W - m.r) / 2).attr("y", H - 8).attr("text-anchor", "middle").text("Minutes elapsed in the period");

  // Stack dots that would overlap so every fight stays visible.
  const placed = [];
  [...DATA.fights].sort((a, b) => a.sec - b.sec).forEach(f => {
    const lane = f.per - 1, px = x(f.sec / 60);
    let level = 0;
    while (placed.some(p => p.lane === lane && p.level === level && Math.abs(p.px - px) < 2 * R + 2)) level++;
    placed.push({ f, lane, px, level, py: laneBase(lane) - R - level * (2 * R + 2) });
  });
  clockDots = svg.selectAll("g.fight-dot").data(placed).join("g")
    .attr("class", "fight-dot").attr("transform", d => `translate(${d.px},${d.py})`)
    .attr("tabindex", 0).attr("role", "button")
    .attr("aria-label", d => `${d.f.p1} versus ${d.f.p2}, ${ord(d.f.per)} period at ${d.f.t}. Open trading cards.`)
    .on("click", (e, d) => openFightCard(d.f))
    .on("keydown", (e, d) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openFightCard(d.f); } });
  clockDots.append("circle").attr("class", "disc").attr("r", R);
  clockDots.append("circle").attr("class", "ring").attr("r", R * 0.5);
  bindTip(clockDots, d => `<strong>${esc(d.f.p1)} vs. ${esc(d.f.p2)}</strong><br>${shortDate(d.f.date)}<br>${ord(d.f.per)} period, ${esc(d.f.t)} elapsed<br><em>Click to see the trading cards</em>`);

  refreshers.push(() => {
    clockDots
      .classed("hit", d => !!(state.team && fightHasTeam(d.f, state.team)))
      .classed("dim", d => !!(state.team && !fightHasTeam(d.f, state.team)));
  });
}

/* ---- View: log (filterable list of every fight) --------------------- */
function buildLog() {
  const chips = $("#season-chips");
  chips.innerHTML = [`<button type="button" class="chip" data-season="" aria-pressed="true">All seasons</button>`]
    .concat(SEASONS.map(s => `<button type="button" class="chip" data-season="${s}" aria-pressed="false">${s}</button>`)).join("");
  chips.addEventListener("click", e => {
    const b = e.target.closest(".chip"); if (!b) return;
    state.season = b.dataset.season || null;
    $$(".chip", chips).forEach(c => c.setAttribute("aria-pressed", String(c === b)));
    renderLog();
  });
  $("#log-list").addEventListener("click", e => {
    const vc = e.target.closest(".view-cards");
    if (vc) { openFightCard(DATA.fights.find(f => f.id === vc.dataset.id)); return; }
    const row = e.target.closest(".log-row"); if (!row) return;
    const detail = row.nextElementSibling, open = row.getAttribute("aria-expanded") === "true";
    row.setAttribute("aria-expanded", String(!open));
    detail.hidden = open;
  });
  refreshers.push(renderLog);
  renderLog();
}
function renderLog() {
  const list = $("#log-list");
  const rows = DATA.fights
    .filter(f => fightHasTeam(f, state.team) && (!state.season || f.s === state.season))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  $("#log-count").textContent = `Showing ${rows.length} of ${DATA.fights.length} fights`;
  if (!rows.length) {
    list.innerHTML = `<li class="log-empty">No fights match these filters. Clear the team filter or pick another season.</li>`;
    return;
  }
  list.innerHTML = rows.map(f => {
    const pct = Math.round(f.pct * 100);
    return `<li class="log-item">
      <button type="button" class="log-row" aria-expanded="false">
        <span class="log-date">${shortDate(f.date)}</span>
        <span class="log-match">${esc(f.p1)} <span class="vs">vs.</span> ${esc(f.p2)}</span>
        <span class="log-tags"><span class="tag">${f.t1}</span><span class="tag">${f.t2}</span></span>
      </button>
      <div class="log-detail" hidden>
        <p>${ord(f.per)} period, ${esc(f.t)} elapsed.</p>
        <div class="vote" role="img" aria-label="${pct}% of voters picked ${esc(f.w)}"><span style="width:${pct}%"></span></div>
        <p>${pct}% of fan voters picked ${esc(f.w)}. Rating ${f.rt.toFixed(1)}, ${f.v} votes.</p>
        <p><button type="button" class="btn btn-small view-cards" data-id="${f.id}">View trading cards</button>
        <a href="${f.url}" target="_blank" rel="noopener">Watch the video on HockeyFights.com</a></p>
      </div>
    </li>`;
  }).join("");
}

/* ---------------------------------------------------------------------
   4. SCROLL ENGINE
   Each .step in the HTML has data-step. When one crosses a thin band of
   the viewport, its matching view fades in on the sticky panel.
   --------------------------------------------------------------------- */
const VIEWS = [
  { id: "decline",  title: "Playoff fights per season, one dot per fight", enter: enterDecline },
  { id: "rink",     title: "Every team that fought, on the ice" },
  { id: "mirage",   title: "Four well-known fighters, five playoff runs" },
  { id: "regulars", title: "Who fights: ice time against penalty minutes" },
  { id: "clock",    title: "When in the game fights break out" },
  { id: "log",      title: "Every fight in the dataset" },
  { id: "log",      title: "Every fight in the dataset" }
];

// Each step gets its own background (see SECTION THEMES in styles.css).
// The palette is cream, navy and red. "light" is the base cream palette; "dark" (navy) and
// "red" swap ink and surface colors so text reads cream. Keep in step with SECTION THEMES in styles.css.
const TONES = ["light", "dark", "red", "light", "dark", "red", "light"];

function setStep(i) {
  if (i === state.step) return;
  state.step = i;
  document.body.dataset.step = String(i + 1);
  document.body.dataset.tone = TONES[i] || "light";
  $$(".step").forEach((s, k) => s.classList.toggle("active", k === i));
  const v = VIEWS[i];
  $$(".viz-view").forEach(el => el.classList.toggle("active", el.id === "view-" + v.id));
  $("#panel-title").textContent = v.title;
  hideTip();
  if (v.enter) v.enter();
}

function setupObserver() {
  const steps = $$(".step");
  const mobile = window.matchMedia("(max-width: 900px)").matches;
  // Desktop: watch a band 30-50% down the screen. Mobile: the sticky chart covers the top, so watch the lower band.
  const margin = mobile ? "-62% 0px -8% 0px" : "-30% 0px -50% 0px";
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) setStep(steps.indexOf(en.target)); });
  }, { rootMargin: margin, threshold: 0 });
  steps.forEach(s => io.observe(s));
}

/* ---------------------------------------------------------------------
   INTRO (taped-up title)
   The motion is CSS keyframes in styles.css. This file only:
   1. loads your tape PNGs if they exist (the ice photo is set in styles.css), and
   2. starts the animation by adding .play to the intro.
   --------------------------------------------------------------------- */
function initIntro() {
  const intro = $(".intro");
  if (!intro) return;

  // TAPE IMAGE SLOTS: each <li data-tape="images/..."> in index.html tries to load that PNG.
  // If it loads, the strip switches from flat CSS color to your image (class "has-img").
  // If the file is missing, nothing happens and the flat color stays.
  $$(".tape-pile li[data-tape]").forEach(li => {
    const img = new Image();
    img.onload = () => { li.style.backgroundImage = `url("${li.dataset.tape}")`; li.classList.add("has-img"); };
    img.src = li.dataset.tape;
  });

  intro.classList.add("play");
}

/* ---------------------------------------------------------------------
   CARD DECK (the stacked cards between the title and the first step)
   state.a is the index of the front card. For every card, d = its index minus state.a:
     d = 0          the front card (draggable)
     d = 1 to 4     fanned behind it, up and to the left, each a little more tilted
     d > 4          tucked under the fan, invisible
     d < 0          already thrown: flung off to the left or right, invisible
   CSS does the motion; this code only sets each card's --dx, --dy, --rot and --sc.
   --------------------------------------------------------------------- */
// [dx, dy, tilt in degrees, scale]. dx and dy are in card widths; negative dy is up.
const DECK_FAN = [
  [0, 0, 3, 1],
  [-0.2, -0.05, -4, 0.97],
  [-0.4, -0.1, 6, 0.94],
  [-0.58, -0.17, -7, 0.91],
  [-0.74, -0.25, 10, 0.88]
];

function buildDeck() {
  const stage = $("#deck-stage"), list = $("#deck-cards");
  if (!stage || !list) return;

  // Story order: cards appear in the order their fights happen, then any card not in a fight.
  const ids = [], seen = new Set();
  DATA.fights.forEach(f => [f.c1, f.c2].forEach(id => {
    if (id && DATA.cards[id] && !seen.has(id)) { seen.add(id); ids.push(id); }
  }));
  Object.keys(DATA.cards).forEach(id => { if (!seen.has(id)) ids.push(id); });
  const n = ids.length;
  if (!n) { $("#deck").hidden = true; return; }

  const seasonOf = id => id.split("_")[0];
  list.innerHTML = ids.map((id, i) => {
    const c = { id, ...DATA.cards[id] };
    const alt = `Trading card: ${c.name}, ${TEAMS[c.team] || c.team}, ${seasonOf(id)}`;
    const art = c.img
      ? `<div class="tcard-art"><img class="tcard-img" src="${esc(c.img)}" alt="${esc(alt)}" draggable="false" decoding="async"${i < 6 ? "" : ' loading="lazy"'}></div>`
      : placeholderCard(c);
    return `<li class="deck-card" data-i="${i}">${art}</li>`;
  }).join("");
  const cards = $$(".deck-card", list);
  // If a linked image fails to load, swap in the drawn placeholder instead of a broken image.
  cards.forEach((el, i) => {
    const img = $("img.tcard-img", el);
    if (img) img.addEventListener("error", () => { img.closest(".tcard-art").outerHTML = placeholderCard({ id: ids[i], ...DATA.cards[ids[i]] }); });
  });

  const range = $("#deck-range"), prev = $("#deck-prev"), next = $("#deck-next");
  const count = $("#deck-count"), nameEl = $("#deck-name"), metaEl = $("#deck-meta");
  range.max = String(n - 1);
  const state = { a: 0, dir: {} };   // dir[i] is the side (-1 left, +1 right) card i was thrown to

  function render() {
    const a = state.a;
    cards.forEach((el, i) => {
      const d = i - a;
      let f, op, z;
      if (d >= 0) {
        f = DECK_FAN[Math.min(d, DECK_FAN.length - 1)];
        op = d < DECK_FAN.length ? 1 : 0;
        z = 100 - d;
      } else {
        const dir = state.dir[i] ?? (i % 2 ? 1 : -1);
        f = [dir * 1.9, 0.1, dir * 24, 1];
        op = 0;
        z = 200 + i;
      }
      el.style.setProperty("--dx", f[0]);
      el.style.setProperty("--dy", f[1]);
      el.style.setProperty("--rot", f[2] + "deg");
      el.style.setProperty("--sc", f[3]);
      el.style.opacity = op;
      el.style.zIndex = z;
      el.classList.toggle("is-front", d === 0);
      el.classList.toggle("is-out", op === 0);
      el.setAttribute("aria-hidden", String(d !== 0));
    });
    range.value = String(a);
    prev.disabled = a === 0;
    next.disabled = a === n - 1;
    count.textContent = `Card ${a + 1} of ${n}`;
    const c = DATA.cards[ids[a]];
    nameEl.textContent = c.name;
    metaEl.textContent = [TEAMS[c.team] || c.team, seasonOf(ids[a]), POS[c.pos] || c.pos].filter(Boolean).join(" \u00b7 ");
  }
  const go = i => { state.a = Math.max(0, Math.min(n - 1, i)); render(); };

  // Dragging. Pull the front card away: past 30% of its width, or a quick flick, throws it.
  let drag = null;
  stage.addEventListener("pointerdown", e => {
    const li = e.target.closest(".deck-card");
    if (!li || (e.pointerType === "mouse" && e.button !== 0)) return;
    const i = +li.dataset.i, d = i - state.a;
    if (d < 0 || d >= DECK_FAN.length) return;
    drag = { i, d, li, id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: performance.now(), dx: 0, moved: false };
    if (d === 0) li.setPointerCapture(e.pointerId);
  });
  stage.addEventListener("pointermove", e => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
    drag.dx = dx;
    if (!drag.moved && Math.hypot(dx, dy) > 6) {
      drag.moved = true;
      if (drag.d === 0) drag.li.classList.add("dragging");
    }
    if (drag.moved && drag.d === 0) {
      drag.li.style.setProperty("--px", dx + "px");
      drag.li.style.setProperty("--py", dy * 0.5 + "px");
      drag.li.style.setProperty("--pr", dx / 18 + "deg");
    }
  });
  function endDrag(e, cancelled) {
    if (!drag || e.pointerId !== drag.id) return;
    const { li, d, i, dx, moved, t0 } = drag;
    drag = null;
    li.classList.remove("dragging");
    ["--px", "--py", "--pr"].forEach(p => li.style.removeProperty(p));
    if (cancelled) return;
    if (d === 0) {
      const speed = Math.abs(dx) / Math.max(1, performance.now() - t0);
      if (moved && (Math.abs(dx) > li.offsetWidth * 0.3 || speed > 0.7)) {
        if (state.a < n - 1) { state.dir[state.a] = dx >= 0 ? 1 : -1; go(state.a + 1); }
      } else if (!moved) {
        go(state.a === n - 1 ? 0 : state.a + 1);   // a plain click advances, and loops at the end
      }
    } else if (!moved) {
      go(i);                                       // clicking a card in the fan brings it forward
    }
  }
  stage.addEventListener("pointerup", e => endDrag(e, false));
  stage.addEventListener("pointercancel", e => endDrag(e, true));

  // Slider, buttons and keyboard
  range.addEventListener("input", () => go(+range.value));
  prev.addEventListener("click", () => go(state.a - 1));
  next.addEventListener("click", () => go(state.a + 1));
  stage.addEventListener("keydown", e => {
    const k = e.key;
    if (k === "ArrowRight") go(state.a + 1);
    else if (k === "ArrowLeft") go(state.a - 1);
    else if (k === "Home") go(0);
    else if (k === "End") go(n - 1);
    else return;
    e.preventDefault();
  });

  render();
}

/* ---------------------------------------------------------------------
   INIT
   --------------------------------------------------------------------- */
function init() {
  initIntro();
  // The deck needs only the card data, not d3. Wait for cards.json (image links) so the
  // cards open with their images; if it is missing, the drawn placeholders are used.
  loadCardOverrides().then(buildDeck);
  if (typeof d3 === "undefined") {
    $("#panel-title").textContent = "The chart library did not load. Check your connection and reload.";
    return;
  }
  fillStats();
  buildRink();
  buildDecline();
  buildMirage();
  buildRegulars();
  buildClock();
  buildLog();
  setTeam(null);
  setupObserver();
  setStep(0);
}
document.addEventListener("DOMContentLoaded", init);
