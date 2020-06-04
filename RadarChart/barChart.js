// Provided by: http://bl.ocks.org/Kuerzibe/338052519b1d270b9cd003e0fbfb712e
/////////////////////////////////////////////////////////
/////////////// The Radar Chart Function ////////////////
/// mthh - 2017 /////////////////////////////////////////
// Inspired by the code of alangrafu and Nadieh Bremer //
// (VisualCinnamon.com) and modified for d3 v4 //////////
/////////////////////////////////////////////////////////

const BarChart = function BarChart(parent_selector, data, axes, options) {
	//Wraps SVG text - Taken from http://bl.ocks.org/mbostock/7555321
	const wrap = function(text, width) {
		text.each(function() {
			var text = d3.select(this),
			words = text.text().split(/\s+/).reverse(),
			word,
			line = [],
			lineNumber = 0,
			lineHeight = 1.1, // ems
			y = text.attr("y"),
			dy = parseFloat(text.attr("dy")),
			tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em")
			while (word = words.pop()) {
				line.push(word)
				tspan.text(line.join(" "))
				if (tspan.node().getComputedTextLength() > width) {
					line.pop()
					tspan.text(line.join(" "))
					line = [word]
					tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", `${++lineNumber * lineHeight + dy}em`).text(word)
				}
			}
		})
	}

	const cfg = {
		w: 600,				//Width of the canvas
		h: 600,				//Height of the canvas
		margin: {top: 20, right: 20, bottom: 20, left: 20}, //The margins of the SVG
		barPadding: 5, 	// How much space between bars
		strokeWidth: 2, 		//The width of the stroke for comparison
		colors: d3.scaleOrdinal(["blue", "orange"]),	//Color function,
		format: '.2%',
		unit: '',
		legend: false
	};

	//Put all of the options into a variable called cfg
	if('undefined' !== typeof options){
		for(var i in options){
			if('undefined' !== typeof options[i]){ cfg[i] = options[i]; }
		}//for i
	}//if

	const formatter = d3.format(cfg.format),			//Formatting
		width = cfg.w - cfg.margin.left - cfg.margin.right,
		height = cfg.h - cfg.margin.top - cfg.margin.bottom,
		barSpace = width / axes.length,
		barWidth = barSpace - cfg.barPadding

	console.log("Bar Chart height: "+height)

	// Make x scale
    const xScale = d3.scaleBand()
    .domain(axes.map(a=>a.name))
    .rangeRound([0, width]).padding(cfg.barPadding)
	// Make y scale
	const yScale = d3.scaleLinear()
	.domain([
		d3.min(axes, a=>a.min),
		d3.max(axes, a=>a.max)
	])
	.range([height, 0])

	console.log(`Colors 0: ${cfg.colors(0)}`)

	/////////////////////////////////////////////////////////
	//////////// Create the container SVG and g /////////////
	/////////////////////////////////////////////////////////
	const parent = d3.select(parent_selector);

	//Remove whatever chart with the same id/class was present before
	parent.select("svg").remove();

	//Initiate the chart SVG
	let svg = parent.append("svg")
	.attr("width",  cfg.w)
	.attr("height", cfg.h)
	.attr("class", "barchart");

	//Append a g element
	let g = svg.append("g")
	.attr("transform", "translate(" +cfg.margin.left+ "," +cfg.margin.top+ ")");
	// g.append("rect")
	// .attr("width", width)
	// .attr("height", height)
	// .attr("fill", "#555")

	var xAxis = d3.axisBottom(xScale);
	var yAxis = d3.axisLeft(yScale).ticks(5);

	/////////////////////////////////////////////////////////
	////////// Glow filter for some extra pizzazz ///////////
	/////////////////////////////////////////////////////////

	//Filter for the outside glow
	let filter = g.append('defs').append('filter').attr('id','glow'),
	feGaussianBlur = filter.append('feGaussianBlur').attr('stdDeviation','2.5').attr('result','coloredBlur'),
	feMerge = filter.append('feMerge'),
	feMergeNode_1 = feMerge.append('feMergeNode').attr('in','coloredBlur'),
	feMergeNode_2 = feMerge.append('feMergeNode').attr('in','SourceGraphic');

	/////////////////////////////////////////////////////////
	/////////////// Draw the Circular grid //////////////////
	/////////////////////////////////////////////////////////

	//Wrapper for the grid & axes
	let axisXGroup = g.append("g")
	.attr("class", "x axis")
	.attr("transform", `translate(0, ${height})`)
	.call(xAxis)
	.style("stroke", "#CDCDCD")
	// Move the labels off the axis line
	// .style("text-anchor", "middle")
	.selectAll(".tick text")
    .call(wrap, xScale.bandwidth());

	let axisYGroup = g.append("g")
	.attr("class", "y axis")
	.call(yAxis)
	.style("stroke", "#CDCDCD")

	g.selectAll(".bar")
    // .data() binds our data
    .data(data[1].values)
    // .enter() returns a placeholder reference to each new element
    .enter()
    .append("rect")
	.attr("class", "bar")
	.attr("fill", cfg.colors(1))
	.attr("x", (d,i)=>xScale(axes[i].name))
	.attr("y", height)
	.attr("height", 0)
    // Next add some animation to introduce the data
    .transition().duration(data[1].animate ? 1000 : 0)
	.ease(d3.easeElasticOut)
    // Position the bar using the scales created earlier
    .attr("y", (d,i)=>yScale(d))
    // Width is the same for each bar
    .attr("width", xScale.bandwidth()+"px")
    .attr("height", (d)=>height-yScale(d)+"px")
	// .style("filter" , "url(#glow)")

	g.selectAll(".comparison")
    .data(data[0].values)
    .enter()
    .append("rect")
	.attr("class", "comparison")
	.attr("fill", cfg.colors(0))
	.attr("x", (d,i)=>xScale(axes[i].name)+xScale.bandwidth()/2)
	.attr("y", (d,i)=>yScale(d))
	.attr("height", "2.5px")
	.attr("width", 0)
    .transition().duration(data[0].animate ? 2000 : 0)
    .ease(d3.easeElasticOut)
	.attr("x", (d,i)=>xScale(axes[i].name)+xScale.bandwidth()*0.2/2)
    .attr("width", xScale.bandwidth()*0.8+"px")
	.style("filter" , "url(#glow)")

	/////////////////////////////////////////////////////////
	//////////////////// Draw the axes //////////////////////
	/////////////////////////////////////////////////////////

	// Add a Y axis label for units. It's centered vertically and rotated by -90
    g.append("text")
        .text(cfg.unit)
        .attr("x", -height/2)
        .attr("y", -(cfg.margin.left / 2 + 5)) // Position the label nicely horizontal
        .attr("transform", "rotate(-90)")
        .style("text-anchor", "middle")

	const tooltip = g.append("text")
	.attr("class", "tooltip")
	.attr('x', 0)
	.attr('y', 0)
	.style("font-size", "12px")
	.style('display', 'none')
	.attr("text-anchor", "middle")
	.attr("dy", "0.35em");

	if (cfg.legend !== false && typeof cfg.legend === "object") {
		let legendZone = svg.append('g');
		let names = data.map(el => el.name);
		if (cfg.legend.title) {
			let title = legendZone.append("text")
			.attr("class", "title")
			.attr('transform', `translate(${cfg.legend.translateX},${cfg.legend.translateY})`)
			.attr("x", cfg.w - 70)
			.attr("y", 10)
			.attr("font-size", "12px")
			.text(cfg.legend.title);
		}
		let legend = legendZone.append("g")
		.attr("class", "legend")
		.attr("height", 100)
		.attr("width", 200)
		.attr('transform', `translate(${cfg.legend.translateX},${cfg.legend.translateY + 20})`);
		// Create rectangles markers
		legend.selectAll('rect')
		.data(names)
		.enter()
		.append("rect")
		.attr("x", cfg.w - 65)
		.attr("y", (d,i) => i * 20)
		.attr("width", 10)
		.attr("height", 10)
		.style("fill", (d,i) => cfg.colors(i))
		.style("stroke", "white")
		.style("stroke-width", "0.5px");
		// Create labels
		legend.selectAll('text')
		.data(names)
		.enter()
		.append("text")
		.attr("x", cfg.w - 52)
		.attr("y", (d,i) => i * 20 + 9)
		.attr("font-size", "11px")
		.text(d => d);
	}
	return svg;
}
