import './lodash.js';
import {create, enableAutoResize, uuid} from './utils.js';
import './lang.js';
import {loadJSON, removeItem, saveJSON} from './storage.js';

const TICKING_NAME = 'Convention',
	INTERPRETATION_NAME = 'Interpretation',
	REWRITING_NAME = 'Compilation';

const CONTAINER = document.getElementById('container');

var defaultMargin = {top: 30, right: 10, bottom: 100, left: 60};

function boxPlot(data, {
	id,
	title,
	benchName,
	min = data.minInData(),
	max = data.maxInData(),
	margin = defaultMargin,
	width = 800 - margin.left - margin.right,
	height = 450 - margin.top - margin.bottom,
	yAxisText = "Execution Time in ms",
	numberOfElementsPerChunk = 0,
	yTickCount = 4,
	xAxisLabelOffset = 50,
	showLabels = true, // show the text labels beside individual boxplots?
}) {

	var chart = d3.box()
		.whiskers(iqr(1.5))
		.height(height)
		.domain([min, max])
		.showLabels(showLabels);

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
	const chartParent = document.querySelector('#charts');
	chartParent.innerHTML = '';
}

function guidGenerator() {
	const S4 = function() {
		return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
	};
	return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

function createChartParentAndReturnId() {
	let id = 'chart' + guidGenerator();
	var parent = create('div');
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
		min: data.minInData(),
		max: data.maxInData()
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

	let tickingAndRewritingMin = tickingAndRewritingData.minInData();
	let tickingAndRewritingMax = tickingAndRewritingData.maxInData();
	let interpretationMin = interpretationData.minInData();
	let interpretationMax = interpretationData.maxInData();
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
dropArea.addEventListener("drop", evt => onDrop(evt));
dropArea.addEventListener("dragover", evt => onDragOver(evt));

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
		await displayFromFiles(jsons);
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

const benchContainer = document.querySelector('#bench');
const configContainer = document.querySelector('#config');

async function displayFromFiles(jsons) {
	const visConfig = VisConfig.fromBenchmarkFiles(jsons);
	await visConfig.display();
}

const BENCHMARKS_STORE_ATTRIBUTE = 'benchmarks';
const PROPERTIES_STORE_ATTRIBUTE = 'properties';
const SHOW_LABELS_ID = 'showLabels';

async function onGenerate() {
	const visConfig = VisConfig.fromUI();

	if (visConfig) {
		await visConfig.display();
	} else {
		alert('no data to display yet.');
	}
}

document.querySelector('#generate').addEventListener('click', onGenerate);
document.body.addEventListener('keydown', evt => {
	if (evt.ctrlKey && evt.code === "KeyS") {
		evt.preventDefault();
		evt.stopPropagation();

		onGenerate();
	}
}, {
	capture: true
});

document.querySelector('#clearLocalStorage').addEventListener('click', async function clearStorage() {
	await removeItem('visConfig');
});

class VisConfig {

	static get standardProps() { return ['showLabels', 'width', 'height', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft']; }

	static fromJSON(json) {
		json.configs = json.configs.map(config => BenchmarkConfig.fromJSON(config));

		return new VisConfig(json);
	}

	static fromBenchmarkFiles(jsons) {
		const configs = jsons.map(json => BenchmarkConfig.fromBenchmarkFile(json));

		return new VisConfig({ jsons, configs });
	}

	static fromUI() {
		if (!configContainer.hasAttribute(BENCHMARKS_STORE_ATTRIBUTE)) {
			return;
		}

		const savedProps = configContainer.getJSONAttribute(PROPERTIES_STORE_ATTRIBUTE);

		const props = {};
		VisConfig.standardProps.forEach(propName => {
			const element = document.getElementById(propName);
			if (!element) { return; }

			const type = element['data-type'];

			if (type === 'boolean') {
				props[propName] = element.checked;
			} else if(type === 'string') {
				props[propName] = element.value;
			} else if (type === 'number') {
				props[propName] = parseFloat(element.value);
			}

		});

		const jsons = configContainer.getJSONAttribute(BENCHMARKS_STORE_ATTRIBUTE);

		const configs = Array.from(configContainer.querySelectorAll('.benchConfig'))
			.map(parent => BenchmarkConfig.fromUI(parent));

		return new VisConfig(Object.assign({}, savedProps, props, {
			jsons,
			configs,
		}));
	}

	constructor(params) {
		const defaults = {
			showLabels: true,

			width: 800,
			height: 400,

			marginTop: 10,
			marginRight: 10,
			marginBottom: 100,
			marginLeft: 60,
		};
		Object.assign(this, defaults, params);
	}

	async display() {
		this.buildUI();
		this.createChart();
		await this.saveLocalAs('visConfig');
	}

	buildUI() {
		configContainer.innerHTML = '';

		//
		function visAsString() {
			const config = VisConfig.fromUI();
			const json = config.toJSON2();
			return JSON.stringify(json);
		}
		configContainer.append(create('span', {
			draggable: true,
			ondragstart: event => {
				var textToWrite = visAsString();
				var textFileAsBlob = new Blob([textToWrite], {type: 'application/json'});
				var url = window.URL.createObjectURL(textFileAsBlob);
				// file download contents, for dropping into a file system
				event.dataTransfer.setData('DownloadURL', 'application/json:Static.json:' + url)
			},
			innerHTML: 'Drag onto Desktop',
		}));
		configContainer.append(create('span', {
			draggable: true,
			ondragstart: event => {
				// plain text, for dropping into text editor
				event.dataTransfer.setData('text/plain', visAsString());
			},
			innerHTML: ' Drag into Apps',
		}));
		configContainer.append(create('span', {
			onclick: event => {
				alert('not yet')
			},
			innerHTML: ' 📋',
		}));

		// width, height, margin
		configContainer.append(create('div', {
			id: 'props',
		}, VisConfig.standardProps.map(propName => {
			const value = this[propName];
			const type = typeof value;
			if (!["number", "boolean", "string"].includes(type)) {
				throw new TypeError('Property type in buildUI is not supported (' + type + ')')
			}

			let propInput;
			if (type === 'boolean') {
				propInput = create('input', {
					id: propName,
					'data-type': type,

					type: "checkbox",
				});
				if (value) {
					propInput.checked = 'checked';
				}
			} else if (type === 'number' || type === 'string') {
				propInput = create('input', {
					id: propName,
					'data-type': type,

					type: 'text',
					placeholder: propName,
					class: 'variable-length bold',
					value: this[propName],
				});
				if (propInput.type === "text") {
					enableAutoResize(propInput);
				}
			}

			const label = create('label');
			label.setAttribute('for', propInput.id);
			label.innerHTML = propName + ' ';

			return create('div', {}, [label, propInput]);
		})));

		configContainer.setJSONAttribute(PROPERTIES_STORE_ATTRIBUTE, _.omit(this.toJSON2(), VisConfig.standardProps.concat(['jsons', 'configs'])));

		configContainer.setJSONAttribute(BENCHMARKS_STORE_ATTRIBUTE, this.jsons);

		this.configs.forEach(config => {
			configContainer.append(config.buildUI());
		});
	}

	createChart() {
		resetParent();

		const data = _.zip(this.jsons, this.configs).flatMap(([json, config]) => {
			const variationsToDisplay = config.variationsToDisplay;
			const name = config.name;
			const variations = json.variations;

			return variations
				.filter(variation => {
					return Object.entries(variation.parameters).every(([key, value]) => {
						const c = variationsToDisplay[key]
						return c && c.find(([v, shouldInclude]) => v === value && shouldInclude);
					})
				})
				.map(variation => {
					const params = Object.entries(variation.parameters).map((([key, value]) => `${key}:${value}`)).join(', ')
					const values = variation.executions.flatMap(e => e.iterations.map(i => i.elapsed));
					return [`${name} (${params})`, values];
				});
		});

		const margin = {
				left: this.marginLeft,
				right: this.marginRight,
				top: this.marginTop,
				bottom: this.marginBottom,
			},
			width = this.width - margin.left - margin.right,
			height = this.height - margin.top - margin.bottom;

		boxPlot(data, {
			id: createChartParentAndReturnId(),
			title: 'TITLE',
			benchName: 'BENCHNAME',
			// min: 0,//tickingAndRewritingMin,
			// max: 10,//tickingAndRewritingMax,
			margin,
			width,
			height,
			// numberOfElementsPerChunk: 2,
			showLabels: this.showLabels,
		});
	}

	toJSON2() {
		return JSON.parse(JSON.stringify(this));
	}

	async saveLocalAs(key) {
		await saveJSON(key, this);
	}
}

function copyJSON(json) {
	return JSON.parse(JSON.stringify(json));
}

class BenchmarkConfig {

	static fromBenchmarkFile(json) {
		const config = copyJSON(json.config);

		for (let values of Object.values(config)) {
			values.forEach((value, id) => {
				values[id] = [value, true];
			});
		}

		return new BenchmarkConfig({
			name: json.name,
			variationsToDisplay: config
		});
	}

	// = deserialize
	static fromJSON(json) {
		return new BenchmarkConfig(json);
	}

	static fromUI(parent) {
		const keys = Array.from(parent.querySelectorAll('dl dt')).map(e => e.innerHTML);

		const labels = Array.from(parent.querySelectorAll('dl dd')).map(dd => {
			return Array.from(dd.querySelectorAll('li'))
				.map(li => [
					JSON.parse(li.querySelector('label').innerHTML),
					!!li.querySelector('input').checked
				]);
		});

		return new BenchmarkConfig({
			name: parent.querySelector('input.name').value,
			variationsToDisplay: _.fromPairs(_.zip(keys, labels))
		});
	}

	constructor({ name, variationsToDisplay }) {
		this.name = name;
		this.variationsToDisplay = variationsToDisplay;
	}

	buildUI() {
		const list = create('dl');

		const keyValueLists = Object.entries(this.variationsToDisplay)
			.flatMap(([key, values]) => {
				const dt = create('dt', { innerHTML: key });
				const dd = create('dd');
				const ul = create('ul');
				dd.append(ul);

				ul.append(...values.map(([value, shouldInclude]) => {
					const checkBox = create('input');
					checkBox.type = 'checkbox';
					const id = 'id-' + uuid();
					checkBox.id = id;
					checkBox.checked = shouldInclude;
					const label = create('label');
					label.setAttribute('for', id);
					label.innerHTML = JSON.stringify(value);
					return create('li', {}, [checkBox, label]);
				}));

				return [dt, dd];
			});

		list.append(...keyValueLists);
		const name = create('input', {
			type: 'text',
			placeholder: "name",
			class: 'name variable-length bold',
			value: this.name,
		});
		enableAutoResize(name);

		return create('div', { class: 'benchConfig' }, [name, list]);
	}
}

// ------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------

async function loadFromPath(path) {
	return new Promise(resolve => d3.json(path, resolve));
}

async function loadExample() {
	const paths = [
		'./benchmarks/example/aexpr-construction.different-object.interpretation.json',
		'./benchmarks/example/aexpr-construction.different-object.proxies.json',
		'./benchmarks/example/aexpr-construction.different-object.rewriting.json',
		'./benchmarks/example/aexpr-construction.different-object.ticking.json',
	];
	const jsons = await Promise.all(paths.map(loadFromPath));
	await displayFromFiles(jsons);
}

;(async function initialize() {
	const json = await loadJSON('visConfig');
	if (json) {
		const visConfig = VisConfig.fromJSON(json);
		await visConfig.display();
	} else {
		await loadExample();
	}
})();
