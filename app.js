/* =====================================================================
   DATA PAYLOAD
   ===================================================================== */
const ALL_TEAMS = [
  { abbr: "ANA", hasFights: true }, { abbr: "BOS", hasFights: true },
  { abbr: "BUF", hasFights: true }, { abbr: "CAR", hasFights: true },
  { abbr: "CBJ", hasFights: false }, { abbr: "CGY", hasFights: true },
  { abbr: "CHI", hasFights: false }, { abbr: "COL", hasFights: true },
  { abbr: "DAL", hasFights: true }, { abbr: "DET", hasFights: false },
  { abbr: "EDM", hasFights: true }, { abbr: "FLA", hasFights: true },
  { abbr: "LAK", hasFights: true }, { abbr: "MIN", hasFights: true },
  { abbr: "MTL", hasFights: true }, { abbr: "NJD", hasFights: true },
  { abbr: "NSH", hasFights: false }, { abbr: "NYI", hasFights: true },
  { abbr: "NYR", hasFights: true }, { abbr: "OTT", hasFights: true },
  { abbr: "PHI", hasFights: true }, { abbr: "PIT", hasFights: true },
  { abbr: "SEA", hasFights: false }, { abbr: "SJS", hasFights: true },
  { abbr: "STL", hasFights: true }, { abbr: "TBL", hasFights: true },
  { abbr: "TOR", hasFights: true }, { abbr: "UTA", hasFights: false },
  { abbr: "VAN", hasFights: true }, { abbr: "VGK", hasFights: true },
  { abbr: "WPG", hasFights: true }, { abbr: "WSH", hasFights: true }
];

const FIGHTS = [
  { id: 1, players: "D. Nurse vs J. Gadjovich", x: -220, y: 80, teamAbbr: "FLA" },
  { id: 2, players: "N. Hague vs T. Frederic", x: 160, y: -100, teamAbbr: "VGK" },
  { id: 3, players: "D. Pastrnak vs M. Tkachuk", x: 200, y: 90, teamAbbr: "BOS" },
  { id: 4, players: "E. Kane vs A. Englund", x: -150, y: -70, teamAbbr: "EDM" },
  { id: 5, players: "M. Martin vs L. Schenn", x: 80, y: 120, teamAbbr: "NYI" },
  { id: 6, players: "A. Matthews vs S. Stamkos", x: -80, y: -110, teamAbbr: "TOR" },
  { id: 7, players: "L. O'Connor vs R. Colton", x: 190, y: 0, teamAbbr: "COL" },
  { id: 8, players: "N. Hague vs D. Nurse", x: -240, y: -20, teamAbbr: "VGK" }
];

let svg, width, height, gRink, gNodes, gFights;

document.addEventListener("DOMContentLoaded", () => {
  initGraphic();
  setupScrollObserver();
});

function initGraphic() {
  const container = document.getElementById("graphic-container");
  width = container.clientWidth || window.innerWidth;
  height = container.clientHeight || window.innerHeight;

  svg = d3.select("#story-canvas")
    .attr("viewBox", `-${width/2} -${height/2} ${width} ${height}`)
    .style("pointer-events", "auto"); // Ensure SVG can receive clicks

  gRink = svg.append("g").attr("class", "rink-layer").style("opacity", 0);
  gNodes = svg.append("g").attr("class", "nodes-layer");
  gFights = svg.append("g").attr("class", "fights-layer");

  drawRink(gRink);

  // Pre-calculate positions for the initial tight circle cluster
  const simulation = d3.forceSimulation(ALL_TEAMS)
    .force("charge", d3.forceManyBody().strength(-30))
    .force("center", d3.forceCenter(0, 0))
    .force("collide", d3.forceCollide().radius(30))
    .stop();

  for (let i = 0; i < 120; ++i) simulation.tick();

  const nodes = gNodes.selectAll(".team-node")
    .data(ALL_TEAMS)
    .enter()
    .append("g")
    .attr("class", "team-node")
    .attr("transform", d => `translate(${d.x}, ${d.y})`);

  nodes.append("circle")
    .attr("class", "node-bg")
    .attr("r", 26);

  nodes.append("image")
    .attr("href", d => `https://assets.nhle.com/logos/nhl/svg/${d.abbr}_light.svg`)
    .attr("width", 38)
    .attr("height", 38)
    .attr("x", -19)
    .attr("y", -19);
}

function drawRink(g) {
  g.append("rect").attr("x", -350).attr("y", -150).attr("width", 700).attr("height", 300).attr("rx", 60).attr("ry", 60).attr("class", "rink-line");
  g.append("line").attr("x1", 0).attr("y1", -150).attr("x2", 0).attr("y2", 150).attr("class", "rink-line rink-red").attr("stroke-width", 4);
  g.append("circle").attr("cx", 0).attr("cy", 0).attr("r", 45).attr("class", "rink-line rink-blue");
  g.append("line").attr("x1", -120).attr("y1", -150).attr("x2", -120).attr("y2", 150).attr("class", "rink-line rink-blue").attr("stroke-width", 4);
  g.append("line").attr("x1", 120).attr("y1", -150).attr("x2", 120).attr("y2", 150).attr("class", "rink-line rink-blue").attr("stroke-width", 4);
  g.append("path").attr("d", "M -310 -20 A 20 20 0 0 1 -310 20 Z").attr("class", "rink-line rink-red");
  g.append("path").attr("d", "M 310 -20 A 20 20 0 0 0 310 20 Z").attr("class", "rink-line rink-red");
}

function setupScrollObserver() {
  const steps = document.querySelectorAll(".step");
  if (!steps.length) return;
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        steps.forEach(s => s.classList.remove("is-active"));
        entry.target.classList.add("is-active");
        triggerTransition(parseInt(entry.target.getAttribute("data-step")));
      }
    });
  }, { threshold: 0.5 }); // Triggers when the text box is halfway up the screen

  steps.forEach(step => observer.observe(step));
}

function triggerTransition(step) {
  const t = d3.transition().duration(1000).ease(d3.easeCubicInOut);

  if (step === 1) {
    gRink.transition(t).style("opacity", 0);
    gFights.transition(t).style("opacity", 0);
    
    gNodes.transition(t).style("opacity", 1);
    gNodes.selectAll(".team-node").transition(t)
      .style("opacity", 1)
      .attr("transform", d => `translate(${d.x}, ${d.y})`);
  } 
  else if (step === 2) {
    gRink.transition(t).style("opacity", 0);
    gFights.transition(t).style("opacity", 0);
    
    gNodes.transition(t).style("opacity", 1);
    gNodes.selectAll(".team-node").transition(t)
      .style("opacity", d => d.hasFights ? 1 : 0.05); 
  } 
  else if (step === 3 || step === 4) {
    gNodes.transition(t).style("opacity", 0); 
    gRink.transition(t).style("opacity", step === 4 ? 0.3 : 1); 

    gFights.transition(t).style("opacity", step === 4 ? 0.4 : 1);
    const fights = gFights.selectAll(".team-node").data(FIGHTS, d => d.id);
    
    const fightEnter = fights.enter().append("g")
      .attr("class", "team-node")
      .attr("transform", d => `translate(0, 0)`)
      .style("opacity", 0)
      .on("click", function(event, d) {
        const el = d3.select(this);
        const isFlipped = el.classed("flipped");
        
        if (!isFlipped) {
          el.classed("flipped", true);
          el.select(".node-bg").transition().duration(300).attr("r", 85).style("stroke", "#2c2c2c");
          el.select("image").transition().duration(150).style("opacity", 0);
          el.select(".node-details").text(d.players).transition().delay(200).duration(300).style("opacity", 1);
        } else {
          el.classed("flipped", false);
          el.select(".node-bg").transition().duration(300).attr("r", 26).style("stroke", "#cccccc");
          el.select(".node-details").transition().duration(150).style("opacity", 0);
          el.select("image").transition().delay(200).duration(300).style("opacity", 1);
        }
      });

    fightEnter.append("circle").attr("class", "node-bg").attr("r", 26);
    
    fightEnter.append("image")
      .attr("href", d => `https://assets.nhle.com/logos/nhl/svg/${d.teamAbbr}_light.svg`)
      .attr("width", 38).attr("height", 38).attr("x", -19).attr("y", -19);

    fightEnter.append("text").attr("class", "node-details").attr("y", 4);

    fightEnter.merge(fights).transition(t).style("opacity", 1)
      .attr("transform", d => `translate(${d.x}, ${d.y})`);
  }
}
