// RadarChart function for D3 provided by:
// http://bl.ocks.org/Kuerzibe/338052519b1d270b9cd003e0fbfb712e

//////////////////////// Canvas size //////////////////////////////
var margin = { top: 80, right: 100, bottom: 50, left: 100 },
width = 500 - margin.left - margin.right,
height = 400 - margin.top - margin.bottom;

////////////////////////// Data //////////////////////////////
// Rocket League player characteristics (per game):
// - Goals
// - Assists
// - Saves
// - Demos inflicted
// - Demos taken

const axes = [
	{name: "Goals",           min:0, max:5},
	{name: "Assists",         min:0, max:2},
	{name: "Saves",           min:0, max:3},
	{name: "Demos inflicted", min:0, max:3},
	{name: "Demos taken",     min:2, max:0},
]
const players = [{
	name: 'SquishyMuffinz',
	values: [
		2.13,
		0.95,
		1.37,
		0.74,
		0.5
	]
},
// The data array can contain any number of elements
// but more than 3 is hard to read because of overlap.
{
	name: 'Kronovi',
	values: [
		1,
		1,
		1,
		1,
		1
	]
}];
console.log("Data to show:")
console.log(players)

const selectBox = d3.select('body')
.append('select')
.attr('class','select')
.attr('id','playerSelectBox')
.on('change', ()=>{
	playerSelected = d3.select('#playerSelectBox').property('value')
	console.log(`Player selected: ${playerSelected}`)
})

const playerOptions = selectBox
.selectAll('option')
.data(players)
.enter()
.append('option')
.text(d=>d.name)


///// Chart legend, custom color, custom unit, etc. //////////
var radarChartOptions = {
	w: width,
	h: height,
	margin: margin,
    // Max value determines the maximum of the chart range.
	maxValue: 100,
    // Levels determines how many concentric circles appear in the background of the chart. These circles show a label for their position in the range.
	levels: 5,
    // roundStrokes determines whether to connect the dots with straight lines or smooth curves
	roundStrokes: true,
    // Color provides the color for the blob of each player,
    // in their order. I.e. Player 1 - blue, Player 2 - orange
	colors: d3.scaleOrdinal().range(["blue", "orange"]),
    // Wrap width changes how much space is allowed before a line break
    // Word wrapping code provided by: https://bl.ocks.org/mbostock/7555321
    wrapWidth: 100,
    // The format string controls the number precision
    // E.g. change to '.1f' to show the tenth's place decimal
	format: '.0f',
    // This controls the position and title for the legend
	legend: { title: 'Game 4', translateX: 100, translateY: 40 },
    // Unit is appended to the number labels
	unit: '%'
};
console.log("Radar chart configuration:")
console.log(radarChartOptions)

// Draw the chart, get a reference the created svg element :
let svg_radar = RadarChart(".radarChart", players, axes, radarChartOptions)
.style("border-radius", "15px")
.style("background-color", "#222")