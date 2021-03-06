// This is an enhanced version of: http://bl.ocks.org/Kuerzibe/338052519b1d270b9cd003e0fbfb712e
/////////////////////////////////////////////////////////
/////////////// The Radar Chart (Enhanced) //////////////
/// Alex Weiner - 2020 //////////////////////////////////
/////////////////////////////////////////////////////////

const max = Math.max;
const sin = Math.sin;
const cos = Math.cos;
const HALF_PI = Math.PI / 2;

const RadarChart = function RadarChart(parent_selector, data, axes, options) {
	//Wraps SVG text - Taken from http://bl.ocks.org/mbostock/7555321
	const wrap = (text, width) => {
		text.each(function() {
			var text = d3.select(this),
			words = text.text().split(/\s+/).reverse(),
			word,
			line = [],
			lineNumber = 0,
			lineHeight = 1.4, // ems
			y = text.attr("y"),
			x = text.attr("x"),
			dy = parseFloat(text.attr("dy")),
			tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");

			while (word = words.pop()) {
				line.push(word);
				tspan.text(line.join(" "));
				if (tspan.node().getComputedTextLength() > width) {
					line.pop();
					tspan.text(line.join(" "));
					line = [word];
					tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
				}
			}
		});
	}//wrap

	const cfg = {
		w: 600,				//Width of the circle
		h: 600,				//Height of the circle
		margin: {top: 20, right: 20, bottom: 20, left: 20}, //The margins of the SVG
		levels: 3,				//How many levels or inner circles should there be drawn
		labelFactor: 1.25, 	//How much farther than the radius of the outer circle should the labels be placed
		wrapWidth: 60, 		//The number of pixels after which a label needs to be given a new line
		opacityArea: 0.35, 	//The opacity of the area of the blob
		dotRadius: 4, 			//The size of the colored circles of each blog
		opacityCircles: 0.1, 	//The opacity of the circles of each blob
		strokeWidth: 2, 		//The width of the stroke around each blob
		roundStrokes: false,	//If true the area and stroke will follow a round path (cardinal-closed)
		colors: d3.scaleOrdinal(["blue", "orange", "green"]),	//Color function,
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
		angleSlice = Math.PI * 2 / axes.length,		//The width in radians of each "slice"
		width = cfg.w - cfg.margin.left - cfg.margin.right,
		height = cfg.h - cfg.margin.top - cfg.margin.bottom,
		radius = Math.min(width/2, height/2) 	//Radius of the outermost circle

	const rScales = []
	// Create a scale for each axis based on provided min and max values.
	for (var axis of axes) {
		if (axis.max > axis.min) {
			const rScale = d3.scaleSqrt()
			.range([0, radius])
			.domain([axis.min, axis.max]);
			rScales.push(rScale)
		} else {
			const rScale = d3.scaleLinear()
			// .exponent(2)
			.range([0, radius])
			.domain([axis.min, axis.max]);
			rScales.push(rScale)
		}
	}

	/////////////////////////////////////////////////////////
	//////////// Create the container SVG and g /////////////
	/////////////////////////////////////////////////////////
	const parent = d3.select(parent_selector);

	//Remove whatever chart with the same id/class was present before
	parent.select("svg").remove();

	//Initiate the radar chart SVG
	let svg = parent.append("svg")
	.attr("width",  cfg.w)
	.attr("height", cfg.h)
	.attr("class", "radar");

	//Append a g element
	let g = svg.append("g")
	.attr("transform", "translate(" + (width/2 + cfg.margin.left) + "," + (height/2 + cfg.margin.top) + ")");

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
	let axisGrid = g.append("g").attr("class", "axisWrapper");

	//Draw the background circles
	axisGrid.selectAll(".levels")
	.data(d3.range(1,(cfg.levels+1)).reverse())
	.enter()
	.append("circle")
	.attr("class", "gridCircle")
	.attr("r", d => radius / cfg.levels * d)
	.style("fill", "#CDCDCD")
	.style("stroke", "#CDCDCD")
	.style("fill-opacity", cfg.opacityCircles)
	.style("filter" , "url(#glow)");

	/////////////////////////////////////////////////////////
	//////////////////// Draw the axes //////////////////////
	/////////////////////////////////////////////////////////

	//Create the straight lines radiating outward from the center
	var axis = axisGrid.selectAll(".axis")
	.data(axes)
	.enter()
	.append("g")
	.attr("class", "axis");
	//Append the lines
	axis.append("line")
	.attr("x1", 0)
	.attr("y1", 0)
	.attr("x2", (d, i) => radius * cos(angleSlice * i - HALF_PI))
	.attr("y2", (d, i) => radius * sin(angleSlice * i - HALF_PI))
	.attr("class", "line")
	.style("stroke", "#AAA")
	.style("stroke-width", "2px");

	//Append the labels at each axis
	axis.append("text")
	.attr("class", "legend")
	.style("font-size", "11px")
	.attr("text-anchor", "middle")
	.attr("dy", "0.35em")
	.attr("x", (d,i) => radius * cfg.labelFactor * cos(angleSlice * i - HALF_PI))
	.attr("y", (d,i) => radius * cfg.labelFactor * sin(angleSlice * i - HALF_PI))
	.text(d => d.name)
	.call(wrap, cfg.wrapWidth);

	/////////////////////////////////////////////////////////
	///////////// Draw the radar chart blobs ////////////////
	/////////////////////////////////////////////////////////

	//The radial line function
	const radarLine = d3.radialLine()
	.curve(d3.curveLinearClosed)
	.radius((d,i) => rScales[i](d))
	.angle((d,i) => i * angleSlice);

	if(cfg.roundStrokes) {
		radarLine.curve(d3.curveCardinalClosed)
	}

	//Create a wrapper for the blobs
	const blobWrapper = g.selectAll(".radarWrapper")
	.data(data)
	.enter().append("g")
	.attr("class", "radarWrapper");

	//Append the backgrounds
	blobWrapper
	.append("path")
	.attr("class", "radarArea")
	.attr("d", d => radarLine([0,0,0,0,0]))
	.style("fill", (d,i) => cfg.colors(i))
	.style("fill-opacity", cfg.opacityArea)
	.on('mouseover', function(d, i) {
		//Dim all blobs
		parent.selectAll(".radarArea")
		.transition().duration(200)
		.style("fill-opacity", 0.1);
		//Bring back the hovered over blob
		d3.select(this)
		.transition().duration(200)
		.style("fill-opacity", 0.7);
	})
	.on('mouseout', () => {
		//Bring back all blobs
		parent.selectAll(".radarArea")
		.transition().duration(200)
		.style("fill-opacity", cfg.opacityArea);
	})
	.transition().duration(d=>d.animate ? 1000 : 0)
	.ease(d3.easeElasticOut)
	.attr("d", d => radarLine(d.values))

	//Create the outlines
	blobWrapper.append("path")
	.attr("class", "radarStroke")
	.attr("d", radarLine([0,0,0,0,0]))
	.style("stroke-width", cfg.strokeWidth + "px")
	.style("stroke", (d,i) => cfg.colors(i))
	.style("fill", "none")
	.style("filter" , "url(#glow)")
	.transition().duration(d=>d.animate ? 1000 : 0)
	.ease(d3.easeElasticOut)
	.attr("d", d => radarLine(d.values))

	//Append the data dots
	blobWrapper.selectAll(".radarCircle")
	.data((d,i) => d.values.map(v => {
		return {v:v, i:i, animate:d.animate}
	}))
	.enter()
	.append("circle")
	.attr("class", "radarCircle")
	.attr("r", cfg.dotRadius)
	.style("fill", (d) => {
		return cfg.colors(d.i)
	})
	.style("fill-opacity", 0.8)
	.attr("cx", 0)
	.attr("cy", 0)
	.transition().duration(d=>d.animate ? 1000 : 0)
	.ease(d3.easeElasticOut)
	.attr("cx", (d,i) => rScales[i](d.v) * cos(angleSlice * i - HALF_PI))
	.attr("cy", (d,i) => rScales[i](d.v) * sin(angleSlice * i - HALF_PI))

	/////////////////////////////////////////////////////////
	//////// Append invisible circles for tooltip ///////////
	/////////////////////////////////////////////////////////

	//Wrapper for the invisible circles on top
	const blobCircleWrapper = g.selectAll(".radarCircleWrapper")
	.data(data)
	.enter().append("g")
	.attr("class", "radarCircleWrapper");

	//Append a set of invisible circles on top for the mouseover pop-up
	blobCircleWrapper.selectAll(".radarInvisibleCircle")
	.data(d => d.values)
	.enter().append("circle")
	.attr("class", "radarInvisibleCircle")
	.attr("r", cfg.dotRadius * 1.5)
	.attr("cx", (v,i) => rScales[i](v) * cos(angleSlice*i - HALF_PI))
	.attr("cy", (v,i) => rScales[i](v) * sin(angleSlice*i - HALF_PI))
	.style("fill", "none")
	.style("pointer-events", "all")
	.on("mouseover", function(v,i) {
		tooltip
		.attr('x', this.cx.baseVal.value - 10)
		.attr('y', this.cy.baseVal.value - 10)
		.transition()
		.style('display', 'block')
		.style("fill", "white")
		.style("pointer-events", "none")
		.text(formatter(v) + cfg.unit);
	})
	.on("mouseout", function(){
		tooltip.transition()
		.style('display', 'none').text('');
	});

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
			.attr("x", width - 70)
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
		.attr("x", width - 65)
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
		.attr("x", width - 52)
		.attr("y", (d,i) => i * 20 + 9)
		.attr("font-size", "11px")
		.text(d => d);
	}
	return svg;
}
