import './lodash.js';
import { uuid } from './utils.js';

var labels = true; // show the text labels beside individual boxplots?

const TICKING_NAME = 'Convention',
	INTERPRETATION_NAME = 'Interpretation',
	REWRITING_NAME = 'Compilation';

// show labels checkbox
const showLabelsId = 'showLabels';
(() => {
	let container = document.createElement('div');
	container.innerHTML = `<label> <input id="${showLabelsId}" type="checkbox" name="zutat" value="salami" checked> Show Labels </label><br /><br />`;
	document.body.insertBefore(container, document.getElementById('info'));
})();

var defaultMargin = {top: 30, right: 10, bottom: 100, left: 60};

function boxPlot(data, {
	id,
	title,
	benchName,
	min= data.reduce((acc, dat) => Math.min(acc, dat[1].reduce((acc, num) => Math.min(acc, num), Infinity
	)), Infinity),
	max = data.reduce((acc, dat) => Math.max(acc, dat[1].reduce((acc, num) => Math.max(acc, num), -Infinity
	)), -Infinity),
	margin = defaultMargin,
	width = 800 - margin.left - margin.right,
	height = 450 - margin.top - margin.bottom,
	yAxisText = "Execution Time in ms",
	numberOfElementsPerChunk = 0,
	yTickCount = 4,
	xAxisLabelOffset = 50
}) {

	var chart = d3.box()
		.whiskers(iqr(1.5))
		.height(height)
		.domain([min, max])
		.showLabels(document.getElementById(showLabelsId).checked);

	var svg = d3.select('#' + id).append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.attr("class", "box")
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // the x-axis
    var x = d3.scale.ordinal()
        .domain(data.map(d => d[0]))
        .rangeRoundBands([0, width], 0.7, 0.3);
	var xAxisLabelScale = x.copy()
        .rangeRoundBands([0, width], 0.1, 0.05);

    var xAxis = d3.svg.axis()
		.scale(x)
		.orient("bottom");

	// the y-axis
	var y = d3.scale.linear()
		.domain([min, max])
		.range([height + margin.top, 0 + margin.top]);

	var yAxis = d3.svg.axis()
		.scale(y)
		.orient("left");

	var xAxisOffset = 10;
	var xAxisPosition = height + margin.top + xAxisOffset;

	// separator
    if(numberOfElementsPerChunk > 0) {
        function make_x_axis() {
            return d3.svg.axis()
                .scale(x)
                .orient("bottom");
        }

        svg.append("g")
            .attr("class", "separator")
            .attr("transform", `translate(${(x.range()[1] - x.range()[0]) * numberOfElementsPerChunk / 2}, ${xAxisPosition}), scale(${numberOfElementsPerChunk},1)`)
            .call(make_x_axis()
                .tickSize(-(height + xAxisOffset), 0, 0)
                .tickFormat("")
            );
    }

    // horizontal lines
    function make_y_axis() {
        return d3.svg.axis()
            .scale(y)
            .orient("left")
            .ticks(yTickCount)
    }

    svg.append("g")
        .attr("class", "tickLines")
        .call(make_y_axis()
            .tickSize(-width, 0, 0)
            .tickFormat("")
        );

    // draw the boxplots
	svg.selectAll(".box")
		.data(data)
		.enter().append("g")
		.attr("transform", function (d) {
			return "translate(" + x(d[0]) + "," + margin.top + ")";
		})
		.call(chart.width(x.rangeBand()));


	// add a title
	svg.append("text")
		.attr("x", (width / 2))
		.attr("y", 0 + (margin.top / 2))
		.attr("text-anchor", "middle")
		.style("font-size", "18px")
		//.style("text-decoration", "underline")
		.text(title);

	// draw y axis
	svg.append("g")
		.attr("class", "y axis")
		.call(yAxis)
		.append("text") // and text1
		.attr("transform", "rotate(-90)")
		.attr("x", -height / 2 - margin.bottom / 2)
		.attr("y", -55)
		.attr("dy", ".71em")
		.style("text-anchor", "middle")
		.style("font-size", "18px")
		.text(yAxisText);

	// wrapping long labels: https://bl.ocks.org/mbostock/7555321
    function wrap(text, width) {
        text.each(function() {
            var text = d3.select(this),
                words = text.text().split(/\s+/).reverse(),
                word,
                line = [],
                lineNumber = 0,
                lineHeight = 1.1, // ems
                y = text.attr("y"),
                dy = parseFloat(text.attr("dy")),
                tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));
                if (tspan.node().getComputedTextLength() > width) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                }
            }
        });
    }

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + xAxisPosition + ")")
        .call(xAxis)
        .selectAll("text")
        .call(wrap, xAxisLabelScale.rangeBand());

	/*
	// draw x axis
	var xxxAxis = svg.append("g")
		.attr("class", "x axis")
		.call(xAxis);
	//xxxAxis.selectAll("text")
	//  .attr("y", 0)
	//  .attr("x", -7)
	//  .attr("dy", ".35em")
	//  .attr("transform", "rotate(-90)")
	//  .style("text-anchor", "end");
	*/
	svg.append("g").append("text")             // text label for the x axis
		.attr("transform", "translate(0," + xAxisPosition + ")")
		.attr("x", (width / 2))
		.attr("y", xAxisLabelOffset)
		.attr("dy", ".71em")
		.style("text-anchor", "middle")
		.style("font-size", "18px")
		.text(benchName);
/*
*/
}

// Returns a function to compute the interquartile range.
function iqr(k) {
  return function(d, i) {
    var q1 = d.quartiles[0],
        q3 = d.quartiles[2],
        iqr = (q3 - q1) * k,
        i = -1,
        j = d.length;
    while (d[++i] < q1 - iqr);
    while (d[--j] > q3 + iqr);
    return [i, j];
  };
}

function copyJson(json) {
	return JSON.parse(JSON.stringify(json));
}

function resetAndBuildInfo(data) {
	let infoParent = document.querySelector('#info');
	infoParent.innerHTML = `<ul>
    <li><b>Browser:</b> ${data.browser}</li>
    <li><b>Runtime:</b> ${data.test.runtime}</li>
    <li><b>Tests:</b> ${data.test.tests} (${data.test.errors}, ${data.test.failed}, ${data.test.skipped})</li>
</ul>`;
}

function resetParent() {
	let chartParent = document.querySelector('#charts');
	chartParent.innerHTML = '';
}

function guidGenerator() {
	var S4 = function() {
		return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
	};
	return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

function createChartParentAndReturnId() {
	let id = 'chart' + guidGenerator();
	var parent = document.createElement('div');
	parent.id = id;
	document.querySelector('#charts').appendChild(parent);

	return id;
}

function preprocessJson(json) {
    json = copyJson(json);

    let benchmarkData = json[Object.keys(json)[0]];

    // adjusts names according to the paper
    function transformData(data) {
    	const replaceMap = new Map();
        replaceMap.set('Ticking', TICKING_NAME);
        replaceMap.set('Interpretation', INTERPRETATION_NAME);
        replaceMap.set('Rewriting', REWRITING_NAME);

        function transformName(string) {
        	replaceMap.forEach((replacer, matcher) => {
        		string = string.replace(new RegExp(matcher, 'g'), replacer);
			});
        	return string;
		}

		data.suites.forEach(suite => {
			suite.suite = suite.suite.map(transformName);
			suite.title.name = transformName(suite.title.name);
		});
    }
    transformData(benchmarkData);

    return benchmarkData;
}

function arrayEquals(a1, a2) {
	if (!Array.isArray(a1) || !Array.isArray(a2)) {
		return false;
	}

	if (a1.length !== a2.length) {
		return false;
	}

	return a1.every(((value, index) => value === a2[index]));
}

function getSuiteData(json, suiteNames) {
    var suites = json.suites;
    var aspectRatios = suites
		.filter(suite => arrayEquals(suite.suite.slice(0, suiteNames.length), suiteNames))
        .map(suite => suite.title);
        //.filter(bench => bench.name !== 'Compilation');

    var data = aspectRatios
        .map(ar => [ar.name, ar.results.slice(-30)]);

    return data;
}


function chartForSuite(benchmarkData, suiteNames) {
    var data = getSuiteData(benchmarkData, suiteNames);

    boxPlot(data, {
        id: createChartParentAndReturnId(),
        title: suiteNames.join(' - '),
        benchName: '-',
		min: data.reduce((acc, dat) => Math.min(acc, dat[1].reduce((acc, num) => Math.min(acc, num), Infinity
		)), Infinity),
		max: data.reduce((acc, dat) => Math.max(acc, dat[1].reduce((acc, num) => Math.max(acc, num), -Infinity
		)), -Infinity)
    });
}

function minMaxThenCreateChart() {

}

function AEXPR_CONSTRUCTION_CHART(benchmarkData) {
    let unnormalizedDataCopy = copyJson(benchmarkData);
	let dataDiff = getSuiteData(benchmarkData, ['AExpr Construction', 'Different Object']),
		dataSame = getSuiteData(benchmarkData, ['AExpr Construction', 'Same Object']);

    if(dataDiff.length + dataSame.length === 0) {
        createFailureMessage(`
<p>Unable to load Suite 'AExpr Construction': No Measurements available</p>
`);
        return;
    }

    // medians, etc.
	let tickingDiff = dataDiff.find(dat => dat[0] === 'Convention');
	let interpretationDiff = dataDiff.find(dat => dat[0] === 'Interpretation');
	let rewritingDiff = dataDiff.find(dat => dat[0] === 'Compilation');
	let tickingSame = dataSame.find(dat => dat[0] === 'Convention');
	let interpretationSame = dataSame.find(dat => dat[0] === 'Interpretation');
	let rewritingSame = dataSame.find(dat => dat[0] === 'Compilation');

	let medianParent = document.getElementById(createChartParentAndReturnId());
	medianParent.innerHTML = `
<h2>AExpr Construction (create 1000 aexprs example):</h2>
<ul> timing [ms]
  <li>${TICKING_NAME} (same object): ${printMedian(tickingSame)}</li>
  <li>Interpretation (same object): ${printMedian(interpretationSame)}</li>
  <li>Compilation (same object): ${printMedian(rewritingSame)}</li>
  <li>${TICKING_NAME} (different objects): ${printMedian(tickingDiff)}</li>
  <li>Interpretation (different objects): ${printMedian(interpretationDiff)}</li>
  <li>Compilation (different objects): ${printMedian(rewritingDiff)}</li>
</ul>
<ul> Relative Slowdown (different Objects vs same Object)
  <li>${TICKING_NAME}: ${printRelativeSlowdown(tickingDiff, tickingSame)}</li>
  <li>Interpretation: ${printRelativeSlowdown(interpretationDiff, interpretationSame)}</li>
  <li>Compilation: ${printRelativeSlowdown(rewritingDiff, rewritingSame)}</li>
</ul>
<ul> Relative Slowdown (vs ${TICKING_NAME})
  <li>Interpretation (same object): ${printRelativeSlowdown(interpretationSame, tickingSame)}</li>
  <li>Interpretation (different objects): ${printRelativeSlowdown(interpretationDiff, tickingDiff)}</li>
  <li>Compilation (same object): ${printRelativeSlowdown(rewritingSame, tickingSame)}</li>
  <li>Compilation (different objects): ${printRelativeSlowdown(rewritingDiff, tickingDiff)}</li>
</ul>
`;

	// charts:
	dataDiff.forEach(dat => dat[0] += '\n'+'Different Object');
	dataSame.forEach(dat => dat[0] += '\n'+'Same Object');

	function tickingOrRewriting(dat) {
		return dat[0].startsWith('Compilation') ||dat[0].startsWith('Convention');
	}
	function interpretation(dat) {
		return !tickingOrRewriting(dat);
	}
	let tickingAndRewritingData = dataDiff.filter(tickingOrRewriting)
		.concat(dataSame.filter(tickingOrRewriting));
	tickingAndRewritingData.sort();
	let interpretationData = dataDiff.filter(interpretation)
		.concat(dataSame.filter(interpretation));
	interpretationData.sort();

	let tickingAndRewritingMin = tickingAndRewritingData.reduce((acc, dat) => Math.min(acc, dat[1].reduce((acc, num) => Math.min(acc, num), Infinity)), Infinity);
	let tickingAndRewritingMax = tickingAndRewritingData.reduce((acc, dat) => Math.max(acc, dat[1].reduce((acc, num) => Math.max(acc, num), -Infinity)), -Infinity);
	let interpretationMin = interpretationData.reduce((acc, dat) => Math.min(acc, dat[1].reduce((acc, num) => Math.min(acc, num), Infinity)), Infinity);
	let interpretationMax = interpretationData.reduce((acc, dat) => Math.max(acc, dat[1].reduce((acc, num) => Math.max(acc, num), -Infinity)), -Infinity);
	const scale = 100;
	tickingAndRewritingMin = Math.min(tickingAndRewritingMin, interpretationMin / scale);
	tickingAndRewritingMax = Math.max(tickingAndRewritingMax, interpretationMax / scale);
	interpretationMin = Math.min(tickingAndRewritingMin * scale, interpretationMin);
	interpretationMax = Math.max(tickingAndRewritingMax * scale, interpretationMax);

	// adjust names:
    tickingAndRewritingData.concat(interpretationData).forEach(dat => {
        dat[0] = dat[0]
            .replace('Convention', 'Convention,')
            .replace('Rewriting', 'Rewriting,')
            .replace('Interpretation', 'Interpretation,');
    });


	let benchName = 'Implementation Strategy, Configuration',
        margin = Object.assign({}, defaultMargin, {top: 10}),
		width = 600 - margin.left - margin.right,
		height = 400 - margin.top - margin.bottom;
	boxPlot(tickingAndRewritingData, {
		id: createChartParentAndReturnId(),
		title: '',
		benchName,
		min: 0,//tickingAndRewritingMin,
		max: 10,//tickingAndRewritingMax,
		margin,
		width,
		height,
		numberOfElementsPerChunk: 2
	});

	let margin2 = Object.assign({}, defaultMargin, {top: 10}),
		width2 = 335 - margin2.left - margin2.right,
		height2 = 400 - margin2.top - margin2.bottom;
	boxPlot(interpretationData, {
		id: createChartParentAndReturnId(),
		title: '',
		benchName,
        min: 0,//interpretationMin,
		max: 1000,//interpretationMax,
		margin: margin2,
		width: width2,
		height: height2,
		numberOfElementsPerChunk: 2
	});

    chartForSuite(unnormalizedDataCopy, ['AExpr Construction', 'Different Object']);
    chartForSuite(unnormalizedDataCopy, ['AExpr Construction', 'Same Object']);
}

function ratioWithConfidenceIntervals(a, b) {

	const sampleSize = 30;
	function randomSample(arr) {
		return arr[Math.floor(Math.random() * arr.length)];
	}

	function getMedianOfRandomSample(arr) {
		var randomValues = [];
		for(let i = 0; i < sampleSize; i++) {
			randomValues.push(randomSample(arr));
		}
		return d3.median(randomValues);
	}

	function getRatioFromRandomSample(arr1, arr2) {
		return getMedianOfRandomSample(arr1) / getMedianOfRandomSample(arr2);
	}

	const medianRatios = [];
	for(let i = 0; i < 10000; i++) {
		medianRatios.push(getRatioFromRandomSample(a, b));
	}

	medianRatios.sort();
	return {
		ratio: d3.median(a) / d3.median(b),
		lowerBound: d3.quantile(medianRatios, 0.025),
		upperBound: d3.quantile(medianRatios, 0.975)
	}
}

function printMedian(benchData) {
	const exactMedian = d3.median(benchData[1]);
	return exactMedian.toFixed(2);
}

function printRelativeSlowdown(benchData, referenceData) {
	const digits = 2,
		info = ratioWithConfidenceIntervals(benchData[1], referenceData[1]);
	return `${info.ratio.toFixed(digits)} [${info.lowerBound.toFixed(digits)} - ${info.upperBound.toFixed(digits)}]`;
}

function AEXPR_UPDATE_CHART(benchmarkData) {
	benchmarkData = copyJson(benchmarkData);
    let unnormalizedDataCopy = copyJson(benchmarkData);

	let data = getSuiteData(benchmarkData, ['Maintain Aspect Ratio']);

    if(data.length === 0) {
        createFailureMessage(`
<p>Unable to load Suite 'AExpr Update': No Measurements available</p>
`);
        return;
    }

    let baseline = data.find(dat => dat[0] === 'Baseline');
	let baselineMedian = d3.median(baseline[1]);

	// calculate medians and confidence intervals
	let tickingData = data.find(dat => dat[0] === 'Convention');
	let interpretationData = data.find(dat => dat[0] === 'Interpretation');
	let rewritingData = data.find(dat => dat[0] === 'Compilation');

	// show medians and confidence intervals
	let medianParent = document.getElementById(createChartParentAndReturnId());
	medianParent.innerHTML = `
<h2>AExpr update (maintain aspectRatio example):</h2>
<ul> timing [ms]
  <li>baseline: ${printMedian(baseline)}</li>
  <li>Convention: ${printMedian(tickingData)}</li>
  <li>Interpretation: ${printMedian(interpretationData)}</li>
  <li>Compilation: ${printMedian(rewritingData)}</li>
</ul>
<ul> Relative Slowdown (vs baseline)
  <li>Convention: ${printRelativeSlowdown(tickingData, baseline)}</li>
  <li>Interpretation: ${printRelativeSlowdown(interpretationData, baseline)}</li>
  <li>Compilation: ${printRelativeSlowdown(rewritingData, baseline)}</li>
</ul>
`;

	// normalize data
	data.forEach(dat => {
		dat[1] = dat[1].map(val => val / baselineMedian);
	});

	let margin = Object.assign({}, defaultMargin, {top: 10}),
		width = 600 - margin.left - margin.right,
		height = 400 - margin.top - margin.bottom;
	boxPlot(data, {
		id: createChartParentAndReturnId(),
        title: '',
		benchName: 'Implementation Strategy',
		yAxisText: 'Normalized Execution Time (Baseline = 1.0)',
        margin,
		width,
		height
    });

    chartForSuite(unnormalizedDataCopy, ['Maintain Aspect Ratio']);
}

function INTERPRETATION_VS_REWRITING(benchmarkData) {
	benchmarkData = copyJson(benchmarkData);
    let rewritingDataCopy = copyJson(benchmarkData);
    let interpretationDataCopy = copyJson(benchmarkData);

    let rewritingData = getSuiteData(benchmarkData, ['AExpr and Callback Count (Compilation)']);
	let interpretationData = getSuiteData(benchmarkData, ['AExpr and Callback Count (Interpretation)']);

    if(rewritingData.length + interpretationData.length === 0) {
        createFailureMessage(`
<p>Unable to load Suite 'Compilation Transformation Impact': No Measurements available</p>
`);
        return;
    }

    // show medians and confidence intervals
	let medianParent = document.getElementById(createChartParentAndReturnId());
	medianParent.innerHTML = `
<h2>Compilation vs Interpretation (varying #aexpr, 10 callbacks each):</h2>
 <table>
  <tr>
    <th>Size</th>
    <th colspan="2">timing [ms]</th>
    <th>relative slowdown</th>
  </tr>
  <tr>
    <th></th>
    <th>Compilation</th>
    <th>Interpretation</th>
    <th>Compilation vs Interpretation</th>
  </tr>
${rewritingData.map(rewritingDat => {
		let name = rewritingDat[0];
		let interpretationDat = interpretationData.find(dat => dat[0] === name);

		return `<tr>
    <td>${name}</td>
    <td>${printMedian(rewritingDat)}</td>
    <td>${printMedian(interpretationDat)}</td>
    <td>${printRelativeSlowdown(rewritingDat, interpretationDat)}</td>
  </tr>`;
	}).join('')}
</table>
`;

	// normalize data
	let data = [];
	interpretationData.forEach(interpretationDat => {
		let name = interpretationDat[0];
		let median = d3.median(interpretationDat[1]);
		let rewritingDat = rewritingData.find(dat => dat[0] === name);

		interpretationDat[0] = interpretationDat[0].split(' ')[0] +', Interpr.';
		interpretationDat[1] = interpretationDat[1].map(val => val / median);
        if(!rewritingDat) { return; }
		rewritingDat[0] = rewritingDat[0].split(' ')[0] + ', Compilat.';
		rewritingDat[1] = rewritingDat[1].map(val => val / median);

		data.push(interpretationDat, rewritingDat);
	});

    let margin = Object.assign({}, defaultMargin, {top: 10}),
        width = 800 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;
	boxPlot(data.slice(-2*6), {
		id: createChartParentAndReturnId(),
		title: '',
		benchName: 'Benchmark Size, Implementation Strategy',
		yAxisText: 'Normalized Execution Time (Interpretation = 1.0)',
		min:0,
		max:3,
		numberOfElementsPerChunk: 2,
        margin,
        width,
        height
	});

    chartForSuite(rewritingDataCopy, ['AExpr and Callback Count (Compilation)']);
    chartForSuite(interpretationDataCopy, ['AExpr and Callback Count (Interpretation)']);
}

function REWRITING_IMPACT(benchmarkData) {
    benchmarkData = copyJson(benchmarkData);
    let unnormalizedDataCopy = copyJson((benchmarkData));

    let data = getSuiteData(benchmarkData, ['Compilation Transformation Impact']);

    if(data.length <= 1) {
        createFailureMessage(`
<p>Unable to load Suite 'Compilation Transformation Impact': ${data.length} of 2 Measurements available</p>
`);
        return;
    }

    let baselineDat = data.find(dat => dat[0] === 'Baseline'),
        rewritingDat = data.find(dat => dat[0] === 'Compilation'),
        baselineMedian = d3.median(baselineDat[1]);

    // show medians and confidence intervals
    let medianParent = document.getElementById(createChartParentAndReturnId());
    medianParent.innerHTML = `
<h2>Compilation Transformation Impact (sorting a 10000 element array using quicksort)</h2>
<ul> timing [ms]
  <li>Baseline: ${printMedian(baselineDat)}</li>
  <li>Compilation: ${printMedian(rewritingDat)}</li>
Slowdown (Compilation vs Baseline): ${printRelativeSlowdown(rewritingDat, baselineDat)}
</ul>
`;

    // normalize data
    data.forEach(dat => {
        dat[1] = dat[1].map(val => val / baselineMedian);
    });

    let margin = Object.assign({}, defaultMargin, {top: 10}),
        width = 335 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;
    boxPlot(data, {
        id: createChartParentAndReturnId(),
        title: '',
        benchName: 'Implementation Strategy',
        yAxisText: 'Normalized Execution Time (Baseline = 1.0)',
        margin,
        width,
        height
    });

    chartForSuite(unnormalizedDataCopy, ['Compilation Transformation Impact']);
}

function createFailureMessage(message) {
    let medianParent = document.getElementById(createChartParentAndReturnId());
    medianParent.classList.add('failedSuite');
    medianParent.innerHTML = message;
}

function PARTIALLY_REWRITTEN(benchmarkData) {
    const suiteNames = ['Partially Rewritten'];
    let data = getSuiteData(benchmarkData, suiteNames);

    if(data.length >= 11) {
        chartForSuite(benchmarkData, suiteNames);
    } else {
        createFailureMessage(`
<p>Unable to load Suite 'Partially Rewritten': ${data.length} of 11 Measurements available</p>
`);
    }
}

function PARTIALLY_WRAPPED(benchmarkData) {
    const suiteNames = ['Partially Wrapped'];
    let data = getSuiteData(benchmarkData, suiteNames);

    if(data.length >= 11) {
        chartForSuite(benchmarkData, suiteNames);
    } else {
        createFailureMessage(`
<p>Unable to load Suite 'Partially Wrapped': ${data.length} of 11 Measurements available</p>
`);
    }
}

function withIgnoreErrors(cb) {
    try {
        cb();
    } catch (e) {
        console.error(e);
    }
}

function doChartsFromJson(json) {
	resetParent();

    var benchmarkData = preprocessJson(json);

    resetAndBuildInfo(benchmarkData);

	withIgnoreErrors(() => {
		AEXPR_CONSTRUCTION_CHART(benchmarkData);
	});
	withIgnoreErrors(() => {
		AEXPR_UPDATE_CHART(benchmarkData);
	});
	withIgnoreErrors(() => {
		REWRITING_IMPACT(benchmarkData);
	});
	withIgnoreErrors(() => {
		INTERPRETATION_VS_REWRITING(benchmarkData);
	});
    withIgnoreErrors(() => {
        PARTIALLY_REWRITTEN(benchmarkData);
    });
    withIgnoreErrors(() => {
        PARTIALLY_WRAPPED(benchmarkData);
    });
}

/*
 * HISTORY
 */
function createHistory(label = 'unknown history') {
	let history = document.createElement('div');
	history.innerHTML = label;
	document.body.insertBefore(history, document.getElementById('info'));
	history.classList.add('history');
	history.classList.add('clearfix');

	return history;
}

function createHistoryBox(tooltip = 'bench', parent) {
	let historyBox = document.createElement('div');
	historyBox.classList.add('tooltip');
	historyBox.setAttribute("data-tooltip", tooltip);
	parent.insertBefore(historyBox, parent.firstChild);

	return historyBox;
}

function initializeHistoryBox(historyBox) {
    return (error, json) => {
        // update the square visually to reflect the fact that it is ready
        if(!error) {
            historyBox.classList.add('loaded');
            historyBox.onclick = () => doChartsFromJson(json);
        } else {
            historyBox.classList.add('failed');
        }
    };
}

//d3.json("benchmarks/latest.json", doChartsFromJson);
//d3.json('benchmarks/paper_aeabbbfrm/overview.json', doChartsFromJson);

// Benchmarks for paper: Active Expressions as basic Building Block for Reactive Mechanisms
function paperBenchmark(label, directory) {
	let history = createHistory(label);
	function historyBoxFor(fileName) {
		let filePath = `benchmarks/paper_aeabbbfrm/${directory}/${fileName}`;
		let historyBox = createHistoryBox(fileName, history);

		d3.json(filePath, initializeHistoryBox(historyBox));
	}

	for(let i = 1; i <= 100; i++) {
		historyBoxFor(`run${i}.json`);
	}
	historyBoxFor('result.json');
}

function paperOverviewBenchmark() {
	let history = createHistory('Paper Benchmark (Overview)');
	let filePath = `benchmarks/paper_aeabbbfrm/overview.json`;
	let historyBox = createHistoryBox('overview.json', history);

	d3.json(filePath, initializeHistoryBox(historyBox));
}
paperOverviewBenchmark();

// ------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------

const dropArea = document.querySelector('#drop-area');
dropArea.addEventListener('dragenter', evt => dropArea.classList.add("drag"), false);
dropArea.addEventListener('dragleave', evt => dropArea.classList.remove("drag"), false);
dropArea.addEventListener("drop", evt => onDrop(evt))
dropArea.addEventListener("dragover", evt => onDragOver(evt))

function onDragOver(evt) {
	const mode = evt.shiftKey ? "move" : "copy";

	evt.dataTransfer.dropEffect = mode;
	dropArea.transferMode = mode;

	evt.preventDefault();
}

async function onDrop(evt, url) {
	dropArea.classList.remove("drag");

	evt.preventDefault();
	evt.stopPropagation();

	function readBlobAsDataURL(fileOrBlob) {
		return new Promise(resolve => {
			const reader = new FileReader();
			reader.onload = event => resolve(event.target.result);
			reader.readAsDataURL(fileOrBlob);
		});
	}

	const files = evt.dataTransfer.files;
	if (files && files.length > 0) {
		Array.from(files).forEach(async file => {
			const dataURL = await readBlobAsDataURL(file);
			const blob = await fetch(dataURL).then(r => r.blob());
			const text = await blob.text();

			newJSON(JSON.parse(text));
		});
	} else {
		const data = evt.dataTransfer.getData("text");
		if (data) {
			dropArea.append(data);
		} else {
			alert('drop contained no files or text data');
		}
	}

	return true;
}

// ------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------

function createChart(json, config = json.config) {
	const name = json.name;
	const variations = json.variations;
	const data = variations
		.filter(variation => {
			return Object.entries(variation.parameters).every(([key, value]) => config[key] && config[key].includes(value))
		})
		.map(variation => {
			const params = Object.entries(variation.parameters).reduce(((acc, [key, value]) => `${acc}, ${key}:${value}`))
			const values = variation.executions.flatMap(e => {
				return e.iterations.map(i => i.elapsed);
			});
			return [name + '\n' + params, values];
		});

	resetParent();

	const margin = Object.assign({}, defaultMargin, {top: 10}),
		width = 800 - margin.left - margin.right,
		height = 400 - margin.top - margin.bottom;
	boxPlot(data, {
		id: createChartParentAndReturnId(),
		title: 'TITLE',
		benchName: 'BENCHNAME',
		// min: 0,//tickingAndRewritingMin,
		// max: 10,//tickingAndRewritingMax,
		margin,
		width,
		height,
		// numberOfElementsPerChunk: 2
	});
}

function newJSON(json) {
	uiForConfig(json);
	createChart(json);
}

d3.json('../active-expressions-benchmark/results/2020-063-26_11-38-40/aexpr-and-callback-count.rewriting.json', newJSON);

function onGenerate() {
	alert('no data to display yet.');
}

document.querySelector('#generate').addEventListener('click', () => onGenerate());

function uiForConfig(json) {
	const config = document.querySelector('#config');
	config.innerHTML = '';

	onGenerate = () => {
		createChart(json, getConfig());
	};

	const list = document.createElement('dl');

	const d = Object.entries(json.config)
		.flatMap(([key, values]) => {
			const dt = document.createElement('dt');
			dt.innerHTML = key;

			const dd = document.createElement('dd');
			const ul = document.createElement('ul');
			dd.append(ul);

			ul.append(...values.map(value => {
				const li = document.createElement('li');
				const checkBox = document.createElement('input');
				checkBox.type = 'checkbox';
				const id = 'id-' + uuid();
				checkBox.id = id;
				checkBox.checked = true;
				const label = document.createElement('label');
				label.setAttribute('for', id);
				label.innerHTML = JSON.stringify(value);
				li.append(checkBox, label);
				return li;
			}));

			return [dt, dd];
		});

	list.append(...d);
	config.append(list);
}

function getConfig() {
	const config = document.querySelector('#config');

	const keys = Array.from(config.querySelectorAll('dl dt')).map(e => e.innerHTML);
	const labels = Array.from(config.querySelectorAll('dl dd')).map(dd => {
		return Array.from(dd.querySelectorAll('li'))
			.filter(li => li.querySelector('input').checked)
			.map(li => JSON.parse(li.querySelector('label').innerHTML));
	});

	return _.fromPairs(_.zip(keys, labels));
}
