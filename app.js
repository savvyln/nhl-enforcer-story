/* =====================================================================
   DATA PAYLOAD
   ===================================================================== */
const DATA = {
  timeline: [
    { season: "2021-22", bouts: 9 },
    { season: "2022-23", bouts: 10 },
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
    { date: "06/09/22", matchup: "S. Stamkos (TBL) vs. A. Lafrenière (NYR)", winner: "Steven Stamkos" },
    { date: "06/21/21", matchup: "A. Pelech (NYI) vs. Y. Gourde (TBL)", winner: "Adam Pelech" },
    { date: "06/21/21", matchup: "M. Martin (NYI) vs. L. Schenn (TBL)", winner: "Matt Martin" }
  ]
};

/* =====================================================================
   APP INITIALIZATION
   ===================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  initTimelineChart();
  initHeavyweightSlider();
  initMorphCanvas();
  populateFightTable();
  setupObserver();
});

function setupObserver() {
  const steps = document.querySelectorAll(".step");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        steps.forEach(s => s.classList.remove("active"));
        entry.target.classList.add("active");
        const stepIndex = parseInt(entry.target.getAttribute("data-step"));
        renderStepGraphic(stepIndex);
      }
    });
  }, { threshold: 0.5 }); // Adjusted threshold for full-height items

  steps.forEach(step => observer.observe(step));
}

function renderStepGraphic(step) {
  const timelineView = document.getElementById("view-timeline");
  const heavyView = document.getElementById("view-heavyweights");
  const rinkScatterView = document.getElementById("view-rink-scatter");
  const logView = document.getElementById("view-data-log");

  timelineView.classList.toggle("active", step === 1);
  heavyView.classList.toggle("active", step === 2);
  rinkScatterView.classList.toggle("active", step === 3 || step === 4);
  logView.classList.toggle("active", step === 5);

  if (step === 1) animateTimeline();
  else if (step === 3) transformToScatter();
  else if (step === 4) transformToRink();
}

/* =====================================================================
   STEP 1: D3 TIMELINE CHART (With Axis Labels)
   ===================================================================== */
let timelineSvg, xTimeScale, yTimeScale, lineGen;

function initTimelineChart() {
  const container = document.getElementById("view-timeline");
  const width = container.clientWidth || 550;
  const height = container.clientHeight - 100 || 300;
  const margin = { top: 20, right: 30, bottom: 50, left: 50 }; // Increased margin for labels

  timelineSvg = d3.select("#svg-timeline")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", `0 0 ${width} ${height}`);

  xTimeScale = d3.scalePoint()
    .domain(DATA.timeline.map(d => d.season))
    .range([margin.left, width - margin.right]);

  yTimeScale = d3.scaleLinear()
    .domain([0, 12])
    .range([height - margin.bottom, margin.top]);

  // X-Axis
  timelineSvg.append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(xTimeScale))
    .attr("color", "#8b949e")
    .selectAll("text").style("font-size", "12px");
    
  // X-Axis Label
  timelineSvg.append("text")
    .attr("x", width / 2)
    .attr("y", height - 10)
    .style("text-anchor", "middle")
    .style("fill", "#8b949e")
    .text("Playoff Season");

  // Y-Axis
  timelineSvg.append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(yTimeScale).ticks(5))
    .attr("color", "#8b949e");
    
  // Y-Axis Label
  timelineSvg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 15)
    .attr("x", -(height / 2))
    .style("text-anchor", "middle")
    .style("fill", "#8b949e")
    .text("Total Bouts");

  lineGen = d3.line()
    .x(d => xTimeScale(d.season))
    .y(d => yTimeScale(d.bouts))
    .curve(d3.curveMonotoneX);

  timelineSvg.append("path")
    .datum(DATA.timeline)
    .attr("class", "line-path")
    .attr("d", lineGen);

  timelineSvg.selectAll(".point-circle")
    .data(DATA.timeline)
    .enter()
    .append("circle")
    .attr("class", "point-circle")
    .attr("cx", d => xTimeScale(d.season))
    .attr("cy", d => yTimeScale(d.bouts))
    .attr("r", 6);
}

function animateTimeline() {
  const path = timelineSvg.select(".line-path");
  const length = path.node().getTotalLength();

  path.attr("stroke-dasharray", `${length} ${length}`)
    .attr("stroke-dashoffset", length)
    .transition().duration(1600).ease(d3.easeCubicOut)
    .attr("stroke-dashoffset", 0);
}

/* =====================================================================
   STEP 2: HEAVYWEIGHT SLIDER SNAP
   ===================================================================== */
function initHeavyweightSlider() {
  const slider = document.getElementById("guess-slider");
  const valDisplay = document.getElementById("slider-val");
  const wrappers = document.querySelectorAll(".mug-wrapper");

  slider.addEventListener("input", (e) => { valDisplay.textContent = e.target.value; });

  const snapToZero = () => {
    let current = parseInt(slider.value);
    const interval = setInterval(() => {
      if (current <= 0) {
        clearInterval(interval);
        slider.value = 0; valDisplay.textContent = 0;
        wrappers.forEach(w => w.classList.add("stamped"));
      } else {
        current -= 1; slider.value = current; valDisplay.textContent = current;
      }
    }, 20);
  };

  slider.addEventListener("mouseup", snapToZero);
  slider.addEventListener("touchend", snapToZero);
}

/* =====================================================================
   STEPS 3 & 4: SCATTERPLOT -> RINK MAP MORPH
   ===================================================================== */
let morphSvg, rinkGroup, scatterAxesGroup, dotsGroup, edgeTracersGroup;
let xScatter, yScatter;

function initMorphCanvas() {
  morphSvg = d3.select("#svg-morph");

  rinkGroup = morphSvg.append("g").attr("class", "rink-layer").style("opacity", 0);
  scatterAxesGroup = morphSvg.append("g").attr("class", "axes-layer");
  dotsGroup = morphSvg.append("g").attr("class", "dots-layer");
  edgeTracersGroup = morphSvg.append("g").attr("class", "tracers-layer");

  drawRink(rinkGroup);

  xScatter = d3.scaleLinear().domain([0, 30]).range([80, 640]);
  yScatter = d3.scaleLinear().domain([0, 45]).range([380, 50]);

  // Scatter Axes
  scatterAxesGroup.append("g")
    .attr("class", "x-axis")
    .attr("transform", "translate(0, 380)")
    .call(d3.axisBottom(xScatter))
    .attr("color", "#8b949e");

  scatterAxesGroup.append("text")
    .attr("class", "x-label")
    .attr("x", 360).attr("y", 420)
    .attr("fill", "#8b949e")
    .style("text-anchor", "middle")
    .text("Total Playoff Points");

  scatterAxesGroup.append("g")
    .attr("class", "y-axis")
    .attr("transform", "translate(80, 0)")
    .call(d3.axisLeft(yScatter))
    .attr("color", "#8b949e");

  scatterAxesGroup.append("text")
    .attr("class", "y-label")
    .attr("x", -215).attr("y", 30)
    .attr("transform", "rotate(-90)")
    .attr("fill", "#8b949e")
    .style("text-anchor", "middle")
    .text("Total Penalty Minutes (PIM)");

  // Scatterplot Points
  const dots = dotsGroup.selectAll(".player-dot")
    .data(DATA.actualFighters).enter()
    .append("g").attr("class", "player-dot")
    .attr("transform", d => `translate(${xScatter(d.points)}, ${yScatter(d.pim)})`);

  dots.append("circle")
    .attr("r", 9)
    .attr("fill", "var(--accent-red)")
    .attr("stroke", "#ffffff")
    .attr("stroke-width", 2);

  dots.append("text")
    .attr("y", -14)
    .attr("text-anchor", "middle")
    .attr("fill", "var(--text-main)")
    .style("font-size", "11px")
    .style("font-weight", "600")
    .text(d => `${d.name} (${d.team})`);
}

function drawRink(g) {
  g.append("rect").attr("x", 50).attr("y", 50).attr("width", 600).attr("height", 350).attr("rx", 75).attr("ry", 75).attr("fill", "var(--ice-bg)").attr("stroke", "#475569").attr("stroke-width", 4);
  g.append("line").attr("x1", 350).attr("y1", 50).attr("x2", 350).attr("y2", 400).attr("stroke", "var(--ice-marking-red)").attr("stroke-width", 4);
  g.append("circle").attr("cx", 350).attr("cy", 225).attr("r", 50).attr("fill", "none").attr("stroke", "var(--ice-marking-blue)").attr("stroke-width", 3);
  [250, 450].forEach(x => { g.append("line").attr("x1", x).attr("y1", 50).attr("x2", x).attr("y2", 400).attr("stroke", "var(--ice-marking-blue)").attr("stroke-width", 4); });
}

function transformToScatter() {
  const t = d3.transition().duration(1000).ease(d3.easeCubicInOut);
  document.getElementById("rink-chart-title").textContent = "Scorers Who Dropped The Gloves";
  document.getElementById("scatter-legend").style.opacity = 1;
  document.getElementById("edge-callout").classList.remove("visible");

  scatterAxesGroup.transition(t).style("opacity", 1);
  rinkGroup.transition(t).style("opacity", 0);
  edgeTracersGroup.selectAll("*").remove();

  dotsGroup.selectAll(".player-dot").transition(t).attr("transform", d => `translate(${xScatter(d.points)}, ${yScatter(d.pim)})`);
}

function transformToRink() {
  const t = d3.transition().duration(1200).ease(d3.easeCubicInOut);
  document.getElementById("rink-chart-title").textContent = "The Modern Game: Speed & Distance";
  document.getElementById("scatter-legend").style.opacity = 0;
  document.getElementById("edge-callout").classList.add("visible");

  scatterAxesGroup.transition(t).style("opacity", 0);
  rinkGroup.transition(t).style("opacity", 1);

  dotsGroup.selectAll(".player-dot").transition(t).attr("transform", d => `translate(${d.rinkX}, ${d.rinkY})`);

  edgeTracersGroup.selectAll("*").remove();
  DATA.edgeRinkPaths.forEach((pathData, idx) => {
    const path = edgeTracersGroup.append("path")
      .attr("d", pathData.d).attr("fill", "none")
      .attr("stroke", idx === 0 ? "var(--accent-cyan)" : "var(--accent-gold)")
      .attr("stroke-width", 3).attr("stroke-dasharray", "8, 6").style("opacity", 0.9);

    const length = path.node().getTotalLength();
    path.attr("stroke-dasharray", `${length} ${length}`).attr("stroke-dashoffset", length)
      .transition().delay(1200 + (idx * 300)).duration(2000).ease(d3.easeLinear).attr("stroke-dashoffset", 0);
  });
}

/* =====================================================================
   STEP 5: POPULATE DATA TABLE
   ===================================================================== */
function populateFightTable() {
  const tbody = document.getElementById("fight-table-body");
  DATA.allFights.forEach(fight => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${fight.date}</td>
      <td><strong>${fight.matchup}</strong></td>
      <td>${fight.winner}</td>
    `;
    tbody.appendChild(tr);
  });
}
