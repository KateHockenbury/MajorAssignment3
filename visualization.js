// visualization.js

const width = 800;
const height = 600;

// Append SVG element
const svg = d3.select("body").append("svg")
  .attr("width", width)
  .attr("height", height)
  .style("display", "block")  // Ensure it's a block-level element
  .style("margin", "auto");   // Center the SVG horizontally

// Load JSON data
d3.json("author_network.json").then(data => {
  // List of authors' affiliations
  const countryCount = d3.group(data.nodes, d => d.affiliation); // Group by affiliation country
  const topCountries = Array.from(countryCount.entries())
    .sort((a, b) => b[1].length - a[1].length)  // Sort by the number of authors in each country
    .slice(0, 10)  // Take the top 10
    .map(d => d[0]);  // Extract just the country names

  // Define color scale
  const colorScale = d3.scaleOrdinal()
    .domain(topCountries)
    .range(d3.schemeCategory10); // Assigning distinct colors to top countries

  // Set default color for other countries
  const defaultColor = "#A9A9A9"; // Gray color for countries not in top 10

  // Set up force simulation
  const simulation = d3.forceSimulation(data.nodes)
    .force("charge", d3.forceManyBody().strength(-100))   // Apply repulsion to nodes
    .force("collide", d3.forceCollide().radius(d => d.radius + 5))  // Prevent nodes from overlapping
    .force("link", d3.forceLink(data.links).id(d => d.id).distance(30)) // Define link force (distance between connected nodes)
    .force("center", d3.forceCenter(width / 2, height / 2));  // Center the layout in the SVG canvas

  // Create links
  const link = svg.append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(data.links)
    .enter().append("line")
    .attr("stroke-width", 1)
    .attr("stroke", "#aaa");

  // Create nodes
  const node = svg.selectAll("circle.node")
    .data(data.nodes)
    .enter().append("circle")
    .attr("class", "node")
    .attr("r", d => d.degree ? Math.sqrt(d.degree) * 3 : 3) // Node radius based on degree (scaled with sqrt)
    .style("fill", d => topCountries.includes(d.affiliation) ? colorScale(d.affiliation) : defaultColor)
    .call(d3.drag()  // Allow nodes to be dragged around
      .on("start", dragStarted)
      .on("drag", dragging)
      .on("end", dragEnded));

  // Tooltip setup
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  node.on("mouseover", (event, d) => {
    tooltip.transition()
      .duration(200)
      .style("opacity", .9);
    tooltip.html(`Author: ${d.id}<br>Affiliation: ${d.affiliation || "N/A"}`)
      .style("left", (event.pageX) + "px")
      .style("top", (event.pageY - 28) + "px");

    // Dim other nodes
    node.style("opacity", n => n.affiliation === d.affiliation ? 1 : 0.2);
    link.style("opacity", l => l.source.id === d.id || l.target.id === d.id ? 1 : 0.2);
  })
  .on("mouseout", () => {
    tooltip.transition()
      .duration(500)
      .style("opacity", 0);
    node.style("opacity", 1);
    link.style("opacity", 1);
  });

  // Update positions on tick
  simulation.on("tick", () => {
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    node
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);
  });

  // Drag functions
  function dragStarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragging(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragEnded(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  // Add event listeners to sliders
  d3.select("#chargeStrength").on("input", function() {
    simulation.force("charge", d3.forceManyBody().strength(+this.value));
    simulation.alpha(1).restart(); // Restart simulation to apply new value
  });

  d3.select("#collideRadius").on("input", function() {
    simulation.force("collide", d3.forceCollide().radius(+this.value));
    simulation.alpha(1).restart(); // Restart simulation to apply new value
  });

  d3.select("#linkStrength").on("input", function() {
    simulation.force("link", d3.forceLink(data.links).id(d => d.id).distance(30).strength(+this.value));
    simulation.alpha(1).restart(); // Restart simulation to apply new value
  });

}).catch(error => console.log(error));
