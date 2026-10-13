/* =====================================================================
   DATA PAYLOAD
   ===================================================================== */
// A selection of all 32 teams for the initial cluster. 
// "hasFights" indicates they were involved in a post-season fight 2021-2026.
const ALL_TEAMS = [
  { abbr: "ANA", color: "#F47A38", hasFights: true },
  { abbr: "BOS", color: "#FFB81C", hasFights: true },
  { abbr: "BUF", color: "#002654", hasFights: true },
  { abbr: "CAR", color: "#CE1126", hasFights: true },
  { abbr: "CBJ", color: "#002654", hasFights: false },
  { abbr: "CGY", color: "#C8102E", hasFights: true },
  { abbr: "CHI", color: "#CF0A2C", hasFights: false },
  { abbr: "COL", color: "#6F263D", hasFights: true },
  { abbr: "DAL", color: "#006847", hasFights: true },
  { abbr: "DET", color: "#CE1126", hasFights: false },
  { abbr: "EDM", color: "#041E42", hasFights: true },
  { abbr: "FLA", color: "#041E42", hasFights: true },
  { abbr: "LAK", color: "#111111", hasFights: true },
  { abbr: "MIN", color: "#154734", hasFights: true },
  { abbr: "MTL", color: "#AF1E2D", hasFights: true },
  { abbr: "NJD", color: "#CE1126", hasFights: true },
  { abbr: "NSH", color: "#FFB81C", hasFights: false },
  { abbr: "NYI", color: "#00539B", hasFights: true },
  { abbr: "NYR", color: "#0038A8", hasFights: true },
  { abbr: "OTT", color: "#E31837", hasFights: true },
  { abbr: "PHI", color: "#F74902", hasFights: true },
  { abbr: "PIT", color: "#FCB514", hasFights: true },
  { abbr: "SEA", color: "#001628", hasFights: false },
  { abbr: "SJS", color: "#006D75", hasFights: true },
  { abbr: "STL", color: "#002F87", hasFights: true },
  { abbr: "TBL", color: "#002868", hasFights: true },
  { abbr: "TOR", color: "#00205B", hasFights: true },
  { abbr: "UTA", color: "#71AFE5", hasFights: false },
  { abbr: "VAN", color: "#00205B", hasFights: true },
  { abbr: "VGK", color: "#B4975A", hasFights: true },
  { abbr: "WPG", color: "#041E42", hasFights: true },
  { abbr: "WSH", color: "#C8102E", hasFights: true }
];

// Fight coordinates mapped to the ice rink (Center is 0,0)
const FIGHTS = [
  { id: 1, matchup: "EDM vs FLA", players: "Nurse vs Gadjovich", x: -200, y: 100, team1: "EDM", team2: "FLA", color: "#041E42" },
  { id: 2, matchup: "VGK vs EDM", players: "Hague vs Frederic", x: 150, y: -120, team1: "VGK", team2: "EDM", color: "#B4975A" },
  { id: 3, matchup: "BOS vs FLA", players: "Pastrnak vs Tkachuk", x: 220, y: 80, team1: "BOS", team2: "FLA", color: "#FFB81C" },
  { id: 4, matchup: "EDM vs LAK", players: "Kane vs Englund", x: -180, y: -60, team1: "EDM", team2: "LAK", color: "#041E42" },
  { id: 5, matchup: "NYI vs TBL", players: "Martin vs Schenn", x: 50, y: 140, team1: "NYI", team2: "TBL", color: "#00539B" },
  { id: 6, matchup: "TOR vs TBL", players: "Matthews vs Stamkos", x: -50, y: -130, team1: "TOR", team2: "TBL", color: "#00205B" },
  { id: 7, matchup: "COL vs TBL", players: "O'Connor vs Colton", x: 180, y: 0, team1: "COL", team2: "TBL", color: "#6F263D" },
  { id: 8, matchup: "WSH vs CAR", players: "Ovechkin vs Svechnikov", x: -250, y: 0, team1: "WSH", team2: "CAR", color: "#C8102E" }
];

/* =====================================================================
   D3 & SCROLLYTELLING LOGIC
   ===================================================================== */
let svg, width, height;
let gRink, gNodes;

document.addEventListener("DOMContentLoaded", () => {
  initGraphic();
  setupScrollObserver();
});

function initGraphic() {
  const container = document.querySelector(".sticky-graphic");
  width = container.clientWidth;
  height = container.clientHeight;

  svg = d3.select("#story-canvas")
    .attr("viewBox", `-${width/2} -${height/2} ${width} ${height}`);

  gRink = svg.append("g").attr("class", "rink-layer").style("opacity", 0);
  gNodes = svg.append("g").attr("class", "nodes-layer");

  drawRink(gRink);

  // Initial State: Circle pack of all 32 teams
  // Random clustering around center
  const simulation = d3.forceSimulation(ALL_TEAMS)
    .force("charge", d3.forceManyBody().strength(-15))
    .force("center", d3.forceCenter(0, 0))
    .force("collide", d3.forceCollide().radius(22))
    .stop();

  // Run simulation statically to get initial positions
  for (let i = 0; i < 120; ++i) simulation.tick();

  const nodes = gNodes.selectAll(".team-node")
    .data(ALL_TEAMS)
    .enter()
    .append("g")
    .attr("class", "team-node")
    .attr("transform", d => `translate(${d.x}, ${d.y})`)
    .attr("id", d => `node-${d.abbr}`);

  nodes.append("circle")
    .attr("class", "node-circle")
    .attr("r", 20)
    .attr("fill", d => d.color);

  nodes.append("text")
    .attr("class", "node-text")
    .text(d => d.abbr);
}

function drawRink(g) {
  // Simple to-scale aesthetic rink outline
  g.append("rect")
    .attr("x", -300).attr("y", -150)
    .attr("width", 600).attr("height", 300)
    .attr("rx", 60).attr("ry", 60)
    .attr("class", "rink-line");

  // Center Red Line
  g.append("line").attr("x1", 0).attr("y1", -150).attr("x2", 0).attr("y2", 150).attr("class", "rink-line rink-red").attr("stroke-width", 4);
  
  // Center Circle
  g.append("circle").attr("cx", 0).attr("cy", 0).attr("r", 45).attr("class", "rink-line rink-blue");

  // Blue Lines
  g.append("line").attr("x1", -100).attr("y1", -150).attr("x2", -100).attr("y2", 150).attr("class", "rink-line rink-blue").attr("stroke-width", 4);
  g.append("line").attr("x1", 100).attr("y1", -150).attr("x2", 100).attr("y2", 150).attr("class", "rink-line rink-blue").attr("stroke-width", 4);

  // Goal creases
  g.append("path").attr("d", "M -260 -20 A 20 20 0 0 1 -260 20 Z").attr("class", "rink-line rink-red");
  g.append("path").attr("d", "M 260 -20 A 20 20 0 0 0 260 20 Z").attr("class", "rink-line rink-red");
}

/* --- SCROLL TRIGGERS --- */
function setupScrollObserver() {
  const steps = document.querySelectorAll(".step");
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        steps.forEach(s => s.classList.remove("is-active"));
        entry.target.classList.add("is-active");
        
        const stepIndex = parseInt(entry.target.getAttribute("data-step"));
        triggerTransition(stepIndex);
      }
    });
  }, { threshold: 0.5 }); // Triggers when text box is half-way up the screen

  steps.forEach(step => observer.observe(step));
}

function triggerTransition(step) {
  const t = d3.transition().duration(1000).ease(d3.easeCubicInOut);

  if (step === 1) {
    // Show all teams clustered
    gRink.transition(t).style("opacity", 0);
    gNodes.selectAll(".team-node").transition(t).style("opacity", 1)
      .attr("transform", d => `translate(${d.x}, ${d.y})`);
    
    // Clear fight nodes if scrolling up
    gNodes.selectAll(".fight-node").remove();
  } 
  else if (step === 2) {
    // Filter down: Fade out teams with no playoff fights
    gRink.transition(t).style("opacity", 0);
    gNodes.selectAll(".team-node")
      .transition(t)
      .style("opacity", d => d.hasFights ? 1 : 0.1);
      
    gNodes.selectAll(".fight-node").remove();
  } 
  else if (step === 3 || step === 4) {
    // Draw the Rink, map the fights
    gRink.transition(t).style("opacity", 1);
    
    // Hide the original cluster
    gNodes.selectAll(".team-node").transition(t).style("opacity", 0);

    // Bind fight data to new interactive nodes
    const fights = gNodes.selectAll(".fight-node").data(FIGHTS, d => d.id);
    
    const fightEnter = fights.enter().append("g")
      .attr("class", "fight-node team-node")
      .attr("transform", d => `translate(0, 0)`) // Start center, explode out
      .style("opacity", 0)
      .on("click", function(event, d) {
        // Interactive Flip reveal
        const el = d3.select(this);
        const isFlipped = el.classed("flipped");
        
        if (!isFlipped) {
          el.classed("flipped", true);
          el.select(".node-circle").transition().duration(300).attr("r", 55).attr("fill", "#ffffff").attr("stroke", d.color).attr("stroke-width", 3);
          el.select(".node-text").transition().duration(100).style("opacity", 0);
          el.select(".node-details").text(d.players).transition().delay(200).duration(300).style("opacity", 1);
        } else {
          el.classed("flipped", false);
          el.select(".node-circle").transition().duration(300).attr("r", 20).attr("fill", d.color).attr("stroke-width", 2);
          el.select(".node-details").transition().duration(100).style("opacity", 0);
          el.select(".node-text").transition().delay(200).duration(300).style("opacity", 1);
        }
      });

    fightEnter.append("circle")
      .attr("class", "node-circle")
      .attr("r", 20)
      .attr("fill", d => d.color);

    fightEnter.append("text")
      .attr("class", "node-text")
      .text(d => d.team1);

    fightEnter.append("text")
      .attr("class", "node-details")
      .attr("y", 0); // vertically centered

    // Move to ice coordinates
    fightEnter.merge(fights)
      .transition(t)
      .style("opacity", 1)
      .attr("transform", d => `translate(${d.x}, ${d.y})`);
      
    if (step === 4) {
      // Keep rink view, prepare for conclusion text
      gRink.transition(t).style("opacity", 0.4); // dim rink slightly to emphasize text
    } else {
      gRink.transition(t).style("opacity", 1);
    }
  }
}
