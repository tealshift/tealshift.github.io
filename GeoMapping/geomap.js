// GeoMap by Alex Weiner, UCSC Spring 2020
/*eslint-env es6*/
/*eslint-env browser*/
/*eslint no-console: 0*/
/*global d3 */

// Start by defining the size of the entire SVG canvas
var canvasSize = {width: 600, height: 700}
// The margin determines how much space to put around the graph view
var margin = {top: 30, right: 30, bottom: 70, left: 80},
    // Width and height are set with the margin subtracted in each dimension
    width = canvasSize.width - margin.left - margin.right,
    height = canvasSize.height - margin.top - margin.bottom;
console.log(`Margins set: ${JSON.stringify(margin)}`)

// Define SVG. "g" means group and is an SVG container
// select() grabs the first SVG in the html doc
var svg = d3.select("svg")
    // The dimensions of the SVG are set to include the margin space
    .attr("width", canvasSize.width)
    .attr("height", canvasSize.height)

var color = d3.scaleThreshold()
        .domain([1, 10, 50, 200, 500, 1000, 2000, 4000])
        .range(d3.schemeGnBu[9]);

var x = d3.scaleSqrt()
    .domain([0, 4500])
    .rangeRound([width-300, width])

var view = svg.append("g")
    .attr("class", "key")
    .attr("transform", `translate(${margin.left},${margin.top})`);

view.selectAll("rect")
    .data(color.range().map((d) => {
        d = color.invertExtent(d)
        if (d[0] == null) d[0] = x.domain()[0]
        if (d[1] == null) d[1] = x.domain()[1]
        return d
    }))
    .enter().append("rect")
        .attr("height", 8)
        .attr("x", d=>x(d[0]))
        .attr("y", 0)
        .attr("width", d => x(d[1]) - x(d[0]))
        .attr("fill", d=>color(d[0]))

view.append("text")
    .attr("class", "caption")
    .attr("x", x.range()[0])
    .attr("y", margin.top-36)
    .attr("fill", "white")
    .attr("text-anchor", "start")
    .attr("font-weight", "bold")
    .text("Population per square km")

const axis = d3.axisBottom(x)
    .tickSize(13)
    .tickValues(color.domain())
view.call(axis)
    .select(".domain").remove() // Remove the horizontal axis line for a cleaner look

console.log("Loading GeoJSON...")

//Load in GeoJSON and Statistics data
Promise.all([
    d3.json("Norway.json"),
    d3.json("PopulationDensity.json")
]).then(([geoJson, stats]) => {
    var features = parseGeoFeatures(geoJson, stats)

    const maxPopDensity = d3.max(features, f=>f.properties.popDensity)
    console.log("Max density: "+maxPopDensity)

    console.log(features)
    //Norwar coords: [60.4720, 8.4689]
    var scale  = 2400
    var offset = [canvasSize.width/2, canvasSize.height/2]
    var projection = d3.geoAlbers()
                       // .fitExtent([ [0, 0], [canvasSize.width, canvasSize.height] ], features)
                        .rotate([10])
                        .translate(offset)
                        .scale([scale])
                        .center([28.0, 65.4689])

    // Create path using the projection
    var path = d3.geoPath().projection(projection);

    //Bind data and create one path per GeoJSON feature
    svg.selectAll("path")
       .data(features)
       .enter()
       .append("path")
       .attr("id", d=>d.name)
       .attr("d", path)
       .style("stroke", "white")
       .style("stroke-width", 1)
       .style("fill", d => {
           console.log(`${d.properties.NAME_1}: ${d.properties.popDensity} per km^2`)
           if (d.properties.popDensity) {
               return color(d.properties.popDensity)
           }
           return "#444"
       })
       .on("mousemove", (d)=> {
           d3.select(`#${d.name}`)
            .style("stroke", "teal")
            .style("stroke-width", 3)
       }).on("mouseout", (d)=>{
           d3.select(`#${d.name}`)
            .style("stroke", "white")
            .style("stroke-width", 1)
       })
});

// Format the imported data
function buildData(rawStats) {
    console.log(`Parsing stats ${rawStats}}`)
    var stats = []
}

function parseGeoFeatures(json, stats) {
    // Unwind polygons from features
    var features = json.features
    features.forEach((feature) => {
        if(feature.geometry.type == "MultiPolygon") {
            feature.geometry.coordinates.forEach((polygon) => {
                polygon.forEach((ring) => {
                    ring.reverse();
                })
            })
        }
        else if (feature.geometry.type == "Polygon") {
            feature.geometry.coordinates.forEach((ring) => {
                ring.reverse();
            })
        }
        feature.name = feature.properties.NAME_1.replace(/\s/g, '')
    })
    // Match county names from stats and copy them to each land feature
    features.forEach((item, i) => {
        const name = item.properties.NAME_1
        for (var key of Object.keys(stats.label)) {
            const label = stats.label[key]
            if (label == name) {
                const index = stats.index[key]
                const value = stats.value[index]
                item.properties.popDensity = value
            }
        }
    })
    return features
}

// Add a group to the SVG that holds data content
// var view = svg.append("g").attr("id", "view")

// var legend = svg.append("g").attr("id", "legend")
//     .attr("pointer-events", "none")
//     .attr("transform", `translate(${margin.left+width-legendSize.width},`
//                             +` ${margin.top+height-legendSize.height-8})`)
//     .attr("opacity", 0.8)
// var tooltip = svg.append("g").attr("id", "tooltip")
//     .attr("visibility", "hidden")
//     .attr("pointer-events", "none")
// var dotLabels = undefined
// var dots = undefined



// Zoom and Pan
// var zoom = d3.zoom()
//     .scaleExtent([1, 10])
//     .translateExtent([
//         // X starts at 0 and can go to the right edge of the canvas
//         // Y starts at 0 and can go to the bottom of the canvas
//         [0, 0], [canvasSize.width, canvasSize.height]
//     ])
//     .on("zoom", zoomed)
// svg.call(zoom)

// function zoomed() {
//     var transform = d3.event.transform
//     var scale = transform.k
//     // Apply the zoom transformation to the graph content
//     view.attr("transform", transform)
//     // Rescaling the axes allows them to follow the zoom level/position
//     xAxisG.call(xAxis.scale(transform.rescaleX(xScale)))
//     yAxisG.call(yAxis.scale(transform.rescaleY(yScale)))
//     // Inverse scale strokes so they don't get thicker as zoom increases
//     dots.style("stroke-width", strokeWidth / scale)
//     dotLabels.style("font-size", labelSize/scale+"px")
//     view.selectAll(".grid").attr("stroke-width", strokeWidth/scale)
//     updateLegend(scale)
//     moveTooltip()
// }
// function resetZoom() {
//     svg.transition()
//         .duration(500)
//         .call(zoom.transform, d3.zoomIdentity);
// }

