// Scatterplot by Alex Weiner, UCSC Spring 2020

// Start by defining the size of the entire SVG canvas
var canvasSize = {width: 650, height: 400}
// The margin determines how much space to put around the graph view
var margin = {top: 10, right: 30, bottom: 70, left: 80},
    // Width and height are set with the margin subtracted in each dimension
    width = canvasSize.width - margin.left - margin.right,
    height = canvasSize.height - margin.top - margin.bottom;

// More useful constants for layout
const labelSize = 14
const strokeWidth = 1.1
const tooltipSize = {width: 210, height: 76}
const legendSize = {width: 180, height: 140}
console.log(`Margins set: ${JSON.stringify(margin)}`)

// Define SVG. "g" means group and is an SVG container
// select() grabs the first SVG in the html doc
var svg = d3.select("svg")
    // The dimensions of the SVG are set to include the margin space
    .attr("width", canvasSize.width)
    .attr("height", canvasSize.height)
// Add a group to the SVG that holds data content
var view = svg.append("g").attr("id", "view")
var legend = svg.append("g").attr("id", "legend")
    .attr("pointer-events", "none")
    .attr("transform", `translate(${margin.left+width-legendSize.width},`
                            +` ${margin.top+height-legendSize.height-8})`)
    .attr("opacity", 0.8)
var tooltip = svg.append("g").attr("id", "tooltip")
    .attr("visibility", "hidden")
    .attr("pointer-events", "none")
var dotLabels = undefined
var dots = undefined

//Define Scales
    // Create linear scales for the x and y axis position
var xScale = d3.scaleLinear().range([margin.left, canvasSize.width]),
    yScale = d3.scaleLinear().range([margin.top+height, -margin.top])

const pad = 0.08
const strokeBuf = strokeWidth/2
// Create a sqrt scale to calculate circle radius
// Max radius is proportional to canvas height (8%),
// and increased by half the stroke width since stroke draws over the area
var radiusScale = d3.scaleSqrt().range([strokeBuf, height*pad + strokeBuf])
    // Create an ordinal color scale for circle color
var colorScale = d3.scaleOrdinal().range(d3.schemeDark2)

// Create Tooltip
tooltip.append("rect").attr("id", "tooltipBox")
    .attr("width", tooltipSize.width)
    .attr("height", tooltipSize.height)
    .attr("rx", 5).attr("ry", 5)
    .style("stroke", "white")
tooltip.append("circle").attr("id", "tooltipCursor")
    .attr("r", 5)
    .style("fill", "white")

tooltip.append("text").attr("id", "tooltipTitle")
    .attr("class", "text")
    .style("text-anchor", "middle")
    .attr("x", tooltipSize.width/2)
    .attr("y", labelSize)
// Create all tooltip variable labels with the same class name
const varLabels = ["Population", "GDP", "EPC", "Total"]
for (var [i, labelText] of varLabels.entries()) {
    tooltip.append("text").attr("class", "text tooltipVarLabel")
        .attr("y", labelSize*(i+2))
        .text(labelText)
    tooltip.append("text").attr("class", "text tooltipMidLabel")
        .attr("y", labelSize*(i+2))
}
// Create all tooltip value labels with specified IDs
const valLabelIds = ["popLabel", "gdpLabel", "epcLabel", "totalLabel"]
for (var [i, labelId] of valLabelIds.entries()) {
    tooltip.append("text").attr("class", "text tooltipValLabel")
        .attr("id", labelId)
        .attr("y", labelSize*(i+2))
}

tooltip.selectAll(".tooltipVarLabel")
    .style("text-anchor", "start")
    .attr("x", 5)
tooltip.selectAll(".tooltipMidLabel")
    .style("text-anchor", "middle")
    .attr("x", tooltipSize.width/3+10)
    .text(":")
tooltip.selectAll(".tooltipValLabel")
    .style("text-anchor", "end")
    .attr("x", tooltipSize.width-5)

tooltip.selectAll(".text")
    .style("fill", "white")
    .style("font-size", labelSize+"px")

function showTooltip(d) {
    // Configure the tooltip views
    tooltip.select("#tooltipTitle").text(d.name)
    tooltip.select("#tooltipBox").style("fill", colorScale(d.id))
    tooltip.select("#popLabel").text(`${d.population} Million`)
    tooltip.select("#gdpLabel").text(`$${d.gdp} Trillion`)
    tooltip.select("#epcLabel").text(`${d.epc} Million BTUs`)
    tooltip.select("#totalLabel").text(`${d.total} Trillion BTUs`)

    // Make the group visible with fade transition
    if (tooltip.attr("visibility") === "hidden") {
        tooltip.attr("opacity", 0)
            .transition(250)
            .attr("opacity", 1)
    }
    tooltip.attr("visibility", "visible")
    // Hide the static label since it's redundant
    view.select(`#label-${d.id}`).attr("visibility", "hidden")
    legend.attr("opacity", 0.5)
}

// Tooltip along moves with the cursor when visible
function moveTooltip() {
    const xy = d3.mouse(svg.node())
    if (isNaN(xy[0])) { return }
    var x = xy[0], y = xy[1]
    const maxX = canvasSize.width-margin.right/2-tooltipSize.width
    const minX = margin.left
    const maxY = canvasSize.height-margin.bottom-tooltipSize.height
    const minY = margin.top
    // Safe position is clamped within view bounds
    const safeX = Math.max(Math.min(x, maxX), minX)
    const safeY = Math.max(Math.min(y, maxY), minY)
    tooltip.attr("transform", `translate(${safeX}, ${safeY})`)
    tooltip.select("#tooltipCursor")
        .attr("transform", `translate(${x-safeX}, ${y-safeY})`)
}
function hideTooltip(d) {
    tooltip.attr("visibility", "hidden")
    // Show the static label again
    view.select(`#label-${d.id}`).attr("visibility", "visible")
    legend.attr("opacity", 0.8)
}

// Add legend
function addLegend() {
    legend.selectAll("*").remove()
    legend.append("rect") // Bounding box
        .attr("width", legendSize.width)
        .attr("height", legendSize.height)
        .style("fill", "#444")
        .style("rx", "5").style("ry", "5")
    legend.append("text") // Legend title at bottom
        .attr("text-anchor", "middle")
        .attr("x", legendSize.width/2)
        .attr("y", legendSize.height-8)
        .text("Total Energy Consumption")
        .style("fill", "white")
        .style("font-size", "14px")
    // Add 3 sample areas for each order of magnitude
    const examples = [100, 10, 1]
    const heights = [0.65, 0.35, 0.2] // Manual spacings
    for (var [i, trillion] of examples.entries()) {
        legend.append("circle")
            .attr("cx", legendSize.width*0.72)
            .attr("cy", legendSize.height*heights[i])
            .attr("r", radiusScale(trillion))
            .style("fill", "white")
        // Add ID to labels for updating later
        legend.append("text").attr("id", `legendLabel${trillion}`)
            .attr("text-anchor", "end")
            .attr("x", legendSize.width*0.55)
            .attr("y", legendSize.height*heights[i])
            .text(`${trillion} Trillion BTUs`)
            .style("fill", "white")
            .style("font-size", "12px")
    }
}
function updateLegend(scale) {
    const examples = [100, 10, 1]
    for (var trillion of examples) {
        // Scale down the legend values to match current scale
        // It is proportional to the square of the scale
        var scaledVal = trillion/(scale*scale)
        // Show appropriate precision for number size
        if (scaledVal > 10) {
            scaledVal = Math.round(scaledVal)
        } else if (scaledVal > 0.1) {
            scaledVal = Math.round(scaledVal * 10) / 10
        } else {
            scaledVal = Math.round(scaledVal * 100) / 100
        }
        legend.select(`#legendLabel${trillion}`)
            .text(`${scaledVal} Trillion BTUs`)
    }
}

// Add margin covers for axes to sit on
svg.append("rect")
    .attr("x", margin.left)
    .attr("y", canvasSize.height - margin.bottom)
    .attr("width", canvasSize.width)
    .attr("height", margin.bottom)
    .style("fill", "#222")
    .style("opacity", 0.91)
svg.append("rect")
    .attr("width", margin.left)
    .attr("height", canvasSize.height)
    .style("fill", "#222")
    .style("opacity", 0.91)

//Define Axes
var xAxis = d3.axisBottom(xScale)
var yAxis = d3.axisLeft(yScale).ticks(5)

// X-axis group
var xAxisG = svg.append("g")
    .attr("class", "x axis")
    .attr("transform", `translate(0, ${margin.top + height})`)
xAxisG.append("text")
    .attr("class", "label")
    .attr("y", margin.bottom/2 - 8)
    .attr("x", margin.left+(width/2))
    .attr("dy", "0.6em")
    .style("text-anchor", "middle")
    .style("fill", "white")
    .attr("font-size", "12px")
    .text("GDP (in Trillion US Dollars) in 2010");

// Y-axis group
var yAxisG = svg.append("g")
    .attr("class", "y axis")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(yAxis)
yAxisG.append("text")
    .attr("class", "label")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left / 2)
    .attr("x", -(margin.top+(height/2)))
    .style("text-anchor", "middle")
    .style("fill", "white")
    .attr("font-size", "12px")
    .text("Energy Consumption per Capita (in Million BTUs per person)");

// Gridlines for each axis
let gridlinesX = view.append("g")
    .attr("class", "grid")
    // Hide horizontal line above view
    .attr("transform", "translate(0, -200)")

let gridlinesY = view.append("g")
    .attr("class", "grid")

function makeGridlinesX() {
    return d3.axisBottom(xScale)
        .tickSize(height*2)
        .tickFormat("")
}
function makeGridlinesY() {
    return d3.axisLeft(yScale)
        .tickSize(-width*2)
        .tickFormat("")
}

// Zoom and Pan
var zoom = d3.zoom()
    .scaleExtent([1, 10])
    .translateExtent([
        // X starts at 0 and can go to the right edge of the canvas
        // Y starts at 0 and can go to the bottom of the canvas
        [0, 0], [canvasSize.width, canvasSize.height]
    ])
    .on("zoom", zoomed)

svg.call(zoom)

function zoomed() {
    var transform = d3.event.transform
    var scale = transform.k
    // Apply the zoom transformation to the graph content
    view.attr("transform", transform)
    // Rescaling the axes allows them to follow the zoom level/position
    xAxisG.call(xAxis.scale(transform.rescaleX(xScale)))
    yAxisG.call(yAxis.scale(transform.rescaleY(yScale)))
    // Inverse scale strokes so they don't get thicker as zoom increases
    dots.style("stroke-width", strokeWidth / scale)
    dotLabels.style("font-size", labelSize/scale+"px")
    view.selectAll(".grid").attr("stroke-width", strokeWidth/scale)
    updateLegend(scale)
    moveTooltip()
}
function resetZoom() {
    svg.transition()
        .duration(500)
        .call(zoom.transform, d3.zoomIdentity);
}

// Format the imported data
function rowConvert(row, index, columns) {
    console.log(`Parsing row: ${JSON.stringify(row)}`)
    // Columns are Country Name, followed by a long list of years
    const name = row["country"]
    const id = name.replace(/\s/g, '') // ID is the name without spaces
    console.log(`Parsing data for: ${name}`)
    const population = parseInt(row["population"])
    let gdp = parseFloat(row["gdp"])
    if (perCapitaGDP) {
        gdp = Math.round(gdp/population * 10) / 10
    }
    const epc = parseInt(row["ecc"])
    const total = parseInt(row["ec"])
    return {name, gdp, population, epc, total, id}
}

loadData()
function loadData() {
    console.log("Loading CSV data...")
    d3.csv("scatterdata.csv", rowConvert).then((data, error) => {
        if (error) throw error;
        loadChart(data)
    })
}

let isDataLoaded = false
function loadChart(countries) {

    updateScaleDomains(countries)

    // add the gridline groups and legend
    addLegend()

    // Add a dot for each country
    configureDots(countries)

    //Draw Country Names
    configureDotLabels(countries)

    isDataLoaded = true
}

function updateScaleDomains(countries) {
    // Find the max of each axis's data.
    const maxGDP = d3.max(countries, d=>d.gdp)
    const maxECP = d3.max(countries, d=>d.epc)
    const maxTOT = d3.max(countries, d=>d.total)
    xScale.domain([0, maxGDP * 1.25]) // 25% padding
    yScale.domain([0, maxECP * 1.25])
    radiusScale.domain([0, maxTOT]) // Radius range goes to 8% of canvas height
    colorScale.domain(d3.map(countries, d=>d.id))

    if (!isDataLoaded) {
        xAxisG.call(xAxis)
        yAxisG.call(yAxis)
        gridlinesX.call(makeGridlinesX())
        gridlinesY.call(makeGridlinesY())
    } else {
        xAxisG.transition().duration(1000).call(xAxis)
        yAxisG.transition().duration(1000).call(yAxis)
        gridlinesX.transition().duration(1000).call(makeGridlinesX())
        gridlinesY.transition().duration(1000).call(makeGridlinesY())
    }
}

function configureDots(countries, isUpdate) {
    dots = view.selectAll(".dot").data(countries)
    if (!isDataLoaded) {
        console.log("Adding data dots!")
        dots = dots.enter()
            .append("circle")
            .attr("class", "dot")
            .style("stroke-width", strokeWidth)
            // Add tooltip functionality on mouseover
            .style("cursor", "none")
            .on("mousemove", (d, i)=>{
                moveTooltip()
                showTooltip(d)
            }).on("mouseout", (d)=>{
                hideTooltip(d)
            })
    }
    dots.transition().duration(1000)
        .attr("r", d=>radiusScale(d.total))
        .attr("cx", d=>xScale(d.gdp))
        .attr("cy", d=>yScale(d.epc))
        .style("fill", d=>colorScale(d.id))

    console.log(`GDP for ${countries[0].name} is ${xScale(countries[0].gdp)}`)
}
function configureDotLabels(countries) {
    dotLabels = view.selectAll(".text").data(countries)
    if (!isDataLoaded) {
        dotLabels = dotLabels.enter()
            .append("text")
            .attr("class", "text")
            .attr("id", d=>`label-${d.id}`)
            .style("text-anchor", "start")
            .style("fill", "white")
            .style("font-size", labelSize+"px")
            // Prevent labels from blocking mouseover tooltip
            .attr("pointer-events", "none")
            .text(d=>d.name)
    }
    dotLabels.transition().duration(1000)
        .attr("x", d=>xScale(d.gdp))
        .attr("y", d=>yScale(d.epc))

}

d3.select("svg").append("rect")
    .attr("class", "graph-button")
    .attr("id", "resetBtn")
    .attr("x", margin.left/2-20)
    .attr("y", canvasSize.height-margin.bottom/2-17)
    .attr("width", 40)
    .attr("height", 34)
    .on("click", resetZoom)
d3.select("svg").append("text").attr("class", "button-text")
    .attr("x", margin.left/2)
    .attr("y", canvasSize.height-margin.bottom/2-4)
    .text("Reset")
d3.select("svg").append("text").attr("class", "button-text")
    .attr("x", margin.left/2)
    .attr("y", canvasSize.height-margin.bottom/2+12)
    .text("Zoom")

let perCapitaGDP = false
d3.select("svg").append("rect").attr("class", "graph-button")
    .attr("id", "perCapitaBtn")
    .attr("x", margin.left+width/2-40)
    .attr("y", canvasSize.height-margin.bottom/2+4)
    .attr("width", 80)
    .attr("height", 20)
    .on("click", () => {
        return;
        perCapitaGDP = !perCapitaGDP
        if (perCapitaGDP) {
            d3.select("#perCapitaText")
                .style("opacity", 1)
        } else {
            d3.select("#perCapitaText")
                .style("opacity", 0.4)
        }
        resetZoom()
        loadData()
    })
d3.select("svg").append("text").attr("class", "button-text")
    .attr("id", "perCapitaText")
    .attr("x", margin.left+width/2)
    .attr("y", canvasSize.height-margin.bottom/2+18)
    .text("Per Capita")
    .style("opacity", 0.4)

d3.selectAll(".graph-button")
    .style("fill", "#666")
    .style("stroke", "white")
    .style("stroke-width", "2px")
    .on("mouseover", buttonHover)
    .on("mouseout", buttonReset)

function buttonHover() {
    d3.select(this)
        .style("fill", "#999")
        .style("stroke", "black")
        .style("stroke-width", "3px")
}
function buttonReset() {
    d3.select(this)
        .style("fill", "#666")
        .style("stroke", "white")
        .style("stroke-width", "2px")
}

d3.selectAll(".button-text")
    .attr("text-anchor", "middle")
    .style("fill", "white")
    .style("font-family", "sans-serif")
    .style("font-size", "12px")
    .attr("pointer-events", "none")