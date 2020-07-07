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
function createFailureMessage(message) {
    let medianParent = document.getElementById(createChartParentAndReturnId());
    medianParent.classList.add('failedSuite');
    medianParent.innerHTML = message;
}
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
		const textPromises = Array.from(files).map(async file => {
			const dataURL = await readBlobAsDataURL(file);
			const blob = await fetch(dataURL).then(r => r.blob());
			const text = await blob.text();
			return JSON.parse(text);
		});
		const jsons = await Promise.all(textPromises);
		newJSON(jsons);
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

function createChart(jsons, config = jsons.map(json => json.config)) {
	const data2 = jsons.flatMap((json, id) => {
		const conf = config[id];
		const name = json.name;
		const variations = json.variations;

		return variations
			.filter(variation => {
				return Object.entries(variation.parameters).every(([key, value]) => conf[key] && conf[key].includes(value))
			})
			.map(variation => {
				const params = Object.entries(variation.parameters).map((([key, value]) => `${key}:${value}`)).join(', ')
				const values = variation.executions.flatMap(e => e.iterations.map(i => i.elapsed));
				return [`${name} (${params})`, values];
			});
	});

	resetParent();

	const margin = Object.assign({}, defaultMargin, {top: 10}),
		width = 800 - margin.left - margin.right,
		height = 400 - margin.top - margin.bottom;
	boxPlot(data2, {
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

function serializeJSONs(jsons) {
	saveJSON('benchmarks', jsons);
}

function newJSON(jsons) {
	serializeJSONs(jsons);
	uiForConfig(jsons);
	createChart(jsons);
}

function onGenerate() {
	alert('no data to display yet.');
}

document.querySelector('#generate').addEventListener('click', () => onGenerate());
document.querySelector('#clearLocalStorage').addEventListener('click', function clearStorage() {
	localStorage.removeItem('benchmarks');
});

function buildUIForBenchConfig(json, config) {
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
	const div = document.createElement('div');
	const name = document.createElement('span');
	name.style.fontWeight = 'bold';
	name.innerHTML = json.name;
	div.append(name, list);
	config.append(div);
}

const configContainer = document.querySelector('#config');

function uiForConfig(jsons) {
	configContainer.innerHTML = '';

	onGenerate = () => createChart(jsons, getConfig());

	jsons.forEach(json => {
		const parent = document.createElement('div');
		parent.classList.add('benchConfig');
		configContainer.append(parent);
		buildUIForBenchConfig(json, parent);
	});
}

function getBenchConfig(parent) {
	const keys = Array.from(parent.querySelectorAll('dl dt')).map(e => e.innerHTML);
	const labels = Array.from(parent.querySelectorAll('dl dd')).map(dd => {
		return Array.from(dd.querySelectorAll('li'))
			.filter(li => li.querySelector('input').checked)
			.map(li => JSON.parse(li.querySelector('label').innerHTML));
	});

	return _.fromPairs(_.zip(keys, labels));
}

function getConfig() {
	return Array.from(configContainer.querySelectorAll('.benchConfig')).map(parent => {
		return getBenchConfig(parent);
	});
}

// ------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------

import './lang.js';
import { loadJSON, saveJSON } from './storage.js';

async function example() {
	const paths = [
		'./benchmarks/example/aexpr-construction.different-object.interpretation.json',
		'./benchmarks/example/aexpr-construction.different-object.proxies.json',
		'./benchmarks/example/aexpr-construction.different-object.rewriting.json',
		'./benchmarks/example/aexpr-construction.different-object.ticking.json',
	]
	const jsons = await Promise.all(paths.map(path => new Promise(resolve => d3.json(path, resolve))));
	newJSON(jsons);
}

;(function initialize() {
	const jsons = loadJSON('benchmarks');
	if (jsons) {
		newJSON(jsons);
	} else {
		example();
	}
})();
