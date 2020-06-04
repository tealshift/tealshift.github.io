// RadarChart function for D3 provided by:
// http://bl.ocks.org/Kuerzibe/338052519b1d270b9cd003e0fbfb712e

////////////////////////// Data //////////////////////////////
// Rocket League player characteristics (per game):
// - Goals
// - Assists
// - Saves
// - Demos inflicted
// - Demos taken

const axes = [
	{name: "Goals",           unit: "/game", min:0.3, max:2.5},
	{name: "Assists",         unit: "/game", min:0.2, max:1},
	{name: "Saves",           unit: "/game", min:0.3, max:2.5},
	{name: "Demos inflicted", unit: "/game", min:-0.01, max:3},
	{name: "Demos suffered (inversed)", unit: "/game", min:0.95, max:0},
]
function rowConvert(row, index, columns) {
	console.log(`Parsing row: ${JSON.stringify(row)}`)
	const {player, goals, assists, saves} = row
	const demos = row['demos inflicted']
	const demosTaken = row['demos taken']
	return {name: player, values: [goals, assists, saves, demos, demosTaken]}
}
d3.csv('playerStats.csv', rowConvert).then((players) => {
	console.log("Data to show:")
	console.log(players)

	var selected1 = -1, selected2 = -1 // Current selection
	var selection1 = 0, selection2 = 1 // New selection

	function reloadChart() {
		// Copy players from menu list
		const player1 = Object.assign({}, players[selection1])
		const player2 = Object.assign({}, players[selection2])
		// Animate each only if they change
		player1.animate = selection1 !== selected1
		player2.animate = selection2 !== selected2
		// Update selection state
		selected1 = selection1
		selected2 = selection2
		loadRadarChart([player1, player2])
		loadBarChart([player1, player2])
	}

	const selectBox1 = d3.select('#select1')
	.attr('class','select')
	.on('change', ()=>{
		playerSelected = selectBox1.property('value')
		selection1 = selectBox1.property('selectedIndex')
		console.log(`Player 1 selected: ${playerSelected}`)
		reloadChart()
		updateMenus()
	})
	const selectBox2 = d3.select('#select2')
	.attr('class','select')
	.on('change', (i)=>{
		playerSelected = selectBox2.property('value')
		selection2 = selectBox2.property('selectedIndex')
		console.log(`Player 2 selected: ${playerSelected} ${selected2}`)
		reloadChart()
		updateMenus()
	})

	function updateMenus() {
		selectBox1.selectAll('option')
		.data(players).enter()
		.append('option')
		.property("value", (d,i)=>d.name)
	    .property("selected", (d,i)=>i==selection1)
	    // .property("disabled", (d,i)=>i==selection2)
		.text(d=>d.name)

		selectBox2.selectAll('option')
		.data(players).enter()
		.append('option')
		.property("value", (d,i)=>d.name)
	    .property("selected", (d,i)=>i==selection2)
	    // .property("disabled", (d,i)=>i==selection1)
		.text(d=>d.name)
	}
	updateMenus()
	reloadChart()
})

function loadRadarChart(players) {
	///// Chart legend, custom color, custom unit, etc. //////////
	const margin = { top: 80, right: 100, bottom: 50, left: 100 },
		width = 500,
		height = 400
	var radarChartOptions = {
		w: width,
		h: height,
		margin: margin,
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
		format: '.2f',
	    // This controls the position and title for the legend
		legend: { title: 'Rocket League Players', translateX: 100, translateY: 40 },
	    // Unit is appended to the number labels
		unit: '/game'
	};
	console.log("Radar chart configuration:")
	console.log(radarChartOptions)

	// Draw the chart, get a reference the created svg element :
	let svg_radar = RadarChart(".radarChart", players, axes, radarChartOptions)
	.style("border-radius", "15px")
	.style("background-color", "#222")
}

function loadBarChart(players) {
	///// Chart legend, custom color, custom unit, etc. //////////
	const margin = { top: 30, right: 40, bottom: 50, left: 80 },
		width = 500,
		height = 400
	var radarChartOptions = {
		w: width,
		h: height,
		margin: margin,
		barPadding: 0.2,
	    // Color provides the color for the blob of each player,
	    // in their order. I.e. Player 1 - blue, Player 2 - orange
		colors: d3.scaleOrdinal(["blue", "orange"]),
	    // Wrap width changes how much space is allowed before a line break
	    // Word wrapping code provided by: https://bl.ocks.org/mbostock/7555321
	    wrapWidth: 100,
	    // The format string controls the number precision
	    // E.g. change to '.1f' to show the tenth's place decimal
		format: '.2f',
	    // This controls the position and title for the legend
		legend: { title: 'Rocket League Players', translateX: -80, translateY: 40 },
	    // Unit is appended to the number labels
		unit: 'Average # per game'
	};

	// Draw the chart, get a reference the created svg element :
	let svg_radar = BarChart(".barChart", players, axes, radarChartOptions)
	.style("border-radius", "15px")
	.style("background-color", "#222")
}