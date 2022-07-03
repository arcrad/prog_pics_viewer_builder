import React, { useState, useRef, useEffect, Dispatch, SetStateAction, ChangeEvent } from 'react';
import  * as mathjs  from 'mathjs';
//import * as PIXI from 'pixi.js';
import Dexie from "dexie";
//import "dexie-export-import";
import {importDB, exportDB, importInto, peakImportFile} from "dexie-export-import";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
	faUpload, 
} from '@fortawesome/free-solid-svg-icons'

import { saveAs } from 'file-saver';
import JSZip from 'jszip';

import * as d3 from 'd3';
import { ScaleTime, ScaleLinear } from 'd3-scale'; //from DefinitelyTyped types
import { Line } from 'd3-shape'; //from DefinitelyTyped types

//import './Viewer.css';
import { db, Entry, Setting } from './db';
import { GlobalState } from './App';
import EntriesValidator,  { ValidationResults, defaultValidationResults } from './EntriesValidator';

//import './Export.css';

type ExportAttributes = {
	globalState: GlobalState;
	setGlobalState: Dispatch<SetStateAction<GlobalState>>;
}

const margin = { top: 50, right: 40, bottom: 10, left: 30 };
const defaultChartDimensions = { width: 900, height: 250 };
const smallScreenBreakpoint = 700;

const MIN_FRAME_DURATION_MS = 5;
const MAX_FRAME_DURATION_MS = 5000;

//function exportDbProgressCallback(details:ExportProgress){
function zipOnUpdateCallback(
	percent, 
	currentFile
) {
}

function exportDbProgressCallbackFactory(
	setExportDbDataRowsExported, 
	setExportDbDataMaxRows, 
	setCurrentCompletedRows,
	setCurrentMaxRows,
	setProgressPadding
) {
	return (details:ExportProgress) => {
		console.log('exportDbProgressCallBack() called');
		console.log(JSON.stringify(details));
		const rowCountPadding = (Math.max(1, parseInt(details.totalRows*0.3)));
		setExportDbDataMaxRows(details.totalRows+rowCountPadding);
		setCurrentMaxRows(details.totalRows+rowCountPadding);
		setProgressPadding(rowCountPadding);
		setExportDbDataRowsExported(details.completedRows);
		setCurrentCompletedRows(details.completedRows);
	}
}

//async function handleExportDbButtonClick() {
async function handleExportDbButtonClick(setExportDbDataRowsExported, setExportDbDataMaxRows) {
	console.log('handleExportDbButtonClick() called');
	//const dbBlob = await db.export({
	let currentCompletedRows = 0;
	let currentMaxRows = 0;
	let progressPadding = 0;
	let setCurrentCompletedRows = (newVal) => { currentCompletedRows = newVal };
	let setCurrentMaxRows = (newVal) => { currentMaxRows = newVal };
	let setProgressPadding = (newVal) => { progressPadding = newVal };
	const exportDbProgressCallback = exportDbProgressCallbackFactory(
		setExportDbDataRowsExported,
		setExportDbDataMaxRows,
		setCurrentCompletedRows,
		setCurrentMaxRows,
		setProgressPadding
	);
	//clone existing db entries so certain fields can be cleared 
	/*const allEntries = await db.entries.toArray();
	allEntries.forEach( (entry) => {
		console.log(`creating exported version of entry with id = ${entry.id}`);
		//entry.delete(alignedImageBlob);
		console.dir(entry);
		//includeInExport
			/*const id = await db.entries.add({
				date: date,
				draft: true
			});*/
	/*});*/
	//return;	
	console.log('before generate dbBlob');
	const dbBlob = await exportDB(db, {
		prettyJson: true, 
		numRowsPerChunk: 1,
		progressCallback: exportDbProgressCallback,
	}); //[options]
	console.log('after generate dbBlob');
	const zip = new JSZip();
	zip.file("db_data.json", dbBlob);
	console.log('after add dbBlob to zip');
	//saveAs(dbBlob, "db_export.json");
	await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: {
        level: 9
    },
		streamFiles: true
	}, (metadata) => {
		if(metadata.percent) {
		//console.log(`percent = ${metadata.percent}`);
		//console.log(`new rows exported val = ${currentCompletedRows+(progressPadding*(metadata.percent/100))}`);
		setExportDbDataRowsExported(currentCompletedRows+(progressPadding*(metadata.percent/100)));
		}
	})
	/*await zip.generateInternalStream({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: {
        level: 9
    }
	})
	.accumulate()*/
		.then(function (blob) {
			console.log('final zip generated!');
	    saveAs(
				blob, 
				`${(new Date).toISOString().substring(0,10).replaceAll('-','')}-db_export.zip`
			);
			setExportDbDataRowsExported(currentMaxRows);
		});
}

function importDataCallbackFunctionFactory(
	setImportDbDataMaxRows,
	setImportDbDataRowsImported
) {
	return (progressData: importProgress) => {
		console.log('importDataCallbackFunction() called');
		console.log(JSON.stringify(progressData));
		setImportDbDataMaxRows(progressData.totalRows);
		setImportDbDataRowsImported(progressData.completedRows);
	}
}
const handleDbDataFileLoad = async (
	dbDataFileUploadRef,
	setImportDbDataMaxRows,
	setImportDbDataRowsImported,
	setImportDbDataStatus
) => {
	//console.dir(dbDataFileUploadRef.current);
	console.log("handle load db data..");
	setImportDbDataStatus('Started');
	let selectedFile:File;
	if(dbDataFileUploadRef.current && dbDataFileUploadRef.current.files) {
		selectedFile = dbDataFileUploadRef.current.files[0];
		const zip = new JSZip();
		await zip.loadAsync(selectedFile)
		//db_data.json
	 //   .then(function (zip) {
        console.log(zip.files);
		const dbDataBlob = await zip.file("db_data.json").async("blob");
		console.dir(dbDataBlob);
		await importInto(db, dbDataBlob, {
			overwriteValues: true,
			clearTablesBeforeImport: true, 
			progressCallback: importDataCallbackFunctionFactory(
				setImportDbDataMaxRows,
				setImportDbDataRowsImported
			)
		});
		setImportDbDataStatus('Complete');

	/*		});
		zip
.file("my_text.txt")
.async("string")
.then(function success(content) {
    // use the content
}, function error(e) {
    // handle the error
});*/
	}
};

function delay(ms:number) {
	return new Promise( (resolve) => setTimeout(resolve, ms) )
}

function clampFrameDuration(frameDurationInput:number):number {
	if(frameDurationInput) {
		//const frameDurationInputRefValue = parseInt(frameDurationInputRef.current.value as string);
			return frameDurationInput < MIN_FRAME_DURATION_MS ? 
				MIN_FRAME_DURATION_MS 
				: 
				frameDurationInput > MAX_FRAME_DURATION_MS ? 
					MAX_FRAME_DURATION_MS
					: 
					frameDurationInput;
	}
	return frameDurationInput;
}

function getSVGOverlayAxesAndLine(entries:Entry[], svgWidth: number, svgHeight:number) {
		const [minX=0, maxX=0] = d3.extent(entries, d => Date.parse(d.date));
		//setup x axis timeScale
		console.warn(`minX = ${minX}, maxX = ${maxX}`);
    const _x = d3.scaleUtc()
      .domain([minX, maxX])
      .range([margin.left+20 , svgWidth - margin.right-20])
			.nice(); 
		//setup y axis linear scale
    console.warn(`d3.min(entries, d => d.weight) = ${d3.min(entries, d => d.weight)} `);
    console.warn(`d3.max(entries, d => d.weight) = ${d3.max(entries, d => d.weight)} `);
    const _y = d3.scaleLinear()
      .domain(
        [
          (d3.min(entries, d => d.weight) ?? 0),
          (d3.max(entries, d => d.weight) ?? 0)
        ]
      )
      .range([svgHeight - margin.bottom, margin.top])
			.nice();
    const _line = d3.line<Entry>()
      .x( (d) => _x(Date.parse(d.date)) )
      .y( (d) => _y(d.weight || 0) );
		return {
			x: _x,
			y: _y,
			line: _line
		};
}

function drawInlineSVG(svgElem:SVGSVGElement):Promise<HTMLImageElement> {
	return new Promise( (resolve,reject) => {
		console.log('drawInlineSVG');
  	//console.log(rawSVG);
	  var svgURL = new XMLSerializer().serializeToString(svgElem);
    const img = new Image;
    img.onload =  () => {
				console.log('img.onload fired');
        resolve(img);
    };
  	img.src = 'data:image/svg+xml; charset=utf8, ' + encodeURIComponent(svgURL);
	});
}

//need to figure out proper type for svg (Selection is not generic error)
function configureSVGGraph(
	svg:any, 
	svgWidth:number, 
	svgHeight:number, 
	margin:{ [key:string]: number }
) {
	svg
    //const svg = d3.select(svgElem)
    .attr("width", svgWidth + margin.left + margin.right)
    .attr("height", svgHeight + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);
}

//need to figure out proper typing for d3 
function setupSVGGraphXAxis(
	svg:any, 
	svgWidth:number, 
	svgHeight:number, 
	margin:{ [key:string]: number },
	x: any,
	formatXAxis: (domainValue: any) => any,
) {
	svg
		.append("g")
		.attr("class","graphAxis")
		.attr("transform", `translate(0, ${svgHeight-margin.bottom+1})`)
		.attr("color","white")
		//.call(d3.axisBottom(x).ticks(undefined, '%b'));//d3.utcFormat('%b %d')));
		//.call(d3.axisBottom(x).ticks(undefined).tickFormat(formatXAxis));
		.call(d3.axisBottom(x).tickFormat((d) => formatXAxis(d)));
		//.call(d3.axisBottom(x));
}

//need to figure out proper typing for d3 
function setupSVGGraphYAxis(
	svg:any, 
	y:any
) {
	svg
		.append("g")
		.attr("class","graphAxis")
		.attr("transform", `translate(30, 0)`)
		.attr("color","white")
		.call(d3.axisLeft(y));
};

function Export({
	globalState,
	setGlobalState
}: ExportAttributes) { 
	let [loadedInitialData, setLoadedInitialData] = useState<boolean>(false);
	let [statusMessages, setStatusMessages] = useState<string[]>([]);
	let [videoIsReady, setVideoIsReady] = useState<boolean>(false);
	let [entries, setEntries] = useState<Entry[]|null>(null);
	let [entriesProcessed, setEntriesProcessed] = useState(0);
	let [validationResults, setValidationResults] = useState<ValidationResults>({});
	let [frameDuration, setFrameDuration] = useState<number>(150);
	let [overlayFrameNumberIsChecked, setOverlayFrameNumberIsChecked] = useState<boolean>(false);
	let [overlayEntryInfoIsChecked, setOverlayEntryInfoIsChecked] = useState<boolean>(false);
	let [overlayEntryGraphIsChecked, setOverlayEntryGraphIsChecked] = useState<boolean>(false);
	let [firstFrameHoldDuration, setFirstFrameHoldDuration] = useState<number>(150);
	let [lastFrameHoldDuration, setLastFrameHoldDuration] = useState<number>(150);
	let [holdFirstFrameIsChecked, setHoldFirstFrameIsChecked] = useState<boolean>(false);
	let [holdLastFrameIsChecked, setHoldLastFrameIsChecked] = useState<boolean>(false);
	let [exportDbDataMaxRows, setExportDbDataMaxRows] = useState(0);
	let [exportDbDataRowsExported, setExportDbDataRowsExported] = useState(0);
	let [exportDbDataInProgress, setExportDbDataInProgress] = useState(false);
	let [importDbDataMaxRows, setImportDbDataMaxRows] = useState(0);
	let [importDbDataRowsImported, setImportDbDataRowsImported] = useState(0);
	let [importDbDataStatus, setImportDbDataStatus] = useState('Not Started');

	const initializedRef = useRef<boolean>(false);
	const videoElementRef = useRef<HTMLVideoElement|null>(null);
	const videoSourceElementRef = useRef<HTMLSourceElement|null>(null);
	const frameDurationInputRef = useRef<HTMLInputElement|null>(null);
	const overlayFrameNumberInputRef = useRef<HTMLInputElement|null>(null);
	const overlayEntryInfoInputRef = useRef<HTMLInputElement|null>(null);
	const overlayEntryGraphInputRef = useRef<HTMLInputElement|null>(null);
	const holdFirstFrameInputRef = useRef<HTMLInputElement|null>(null);
	const holdLastFrameInputRef = useRef<HTMLInputElement|null>(null);
	const firstFrameHoldDurationInputRef = useRef<HTMLInputElement|null>(null);
	const lastFrameHoldDurationInputRef = useRef<HTMLInputElement|null>(null);
	const dbDataFileUploadContainerRef = useRef<HTMLDivElement>(null);
	const dbDataFileUploadRef = useRef<HTMLInputElement>(null);
	const dbDataFileUploadFileNameRef = useRef<HTMLSpanElement>(null);
	
	useEffect( () => {
		if(dbDataFileUploadRef && dbDataFileUploadRef.current) {
			dbDataFileUploadRef.current.onchange = () => {
				if(dbDataFileUploadRef.current 
					&& dbDataFileUploadRef.current.files
					&& dbDataFileUploadRef.current.files.length > 0) {
						if(dbDataFileUploadFileNameRef.current) {
		      		dbDataFileUploadFileNameRef.current.textContent = dbDataFileUploadRef.current.files[0].name;
							handleDbDataFileLoad(
								dbDataFileUploadRef,
								setImportDbDataMaxRows,
								setImportDbDataRowsImported,
								setImportDbDataStatus
							);
						}
    		}
			};
		}
	},[]);

	useEffect( () => {
		if(initializedRef.current) {
			return;
		}
		console.log('intialize data from DB started');
		initializedRef.current = true;
		Promise.all([
		  db.entries.orderBy('date').filter((entry) => entry.draft !== true).toArray(),
			db.settings.get('exportFrameDuration'),
			db.settings.get('exportFirstFrameHoldDuration'),
			db.settings.get('exportLastFrameHoldDuration'),
			db.settings.get('exportOverlayFrameNumber'),
			db.settings.get('exportOverlayEntryInfo'),
			db.settings.get('exportOverlayEntryGraph'),
			db.settings.get('exportHoldFirstFrame'),
			db.settings.get('exportHoldLastFrame'),
		]).then( ([
			_entries,
			_exportFrameDurationSetting,
			_exportFirstFrameHoldDuration,
			_exportLastFrameHoldDuration,
			_exportOverlayFrameNumber,
			_exportOverlayEntryInfo,
			_exportOverlayEntryGraph,
			_exportHoldFirstFrame,
			_exportHoldLastFrame,
		]) => {
			console.log('intialize data from DB finished');
			if(_entries) {
				console.log(`entries.length = ${_entries.length}`);
				setEntries(_entries);	
			}
			if(_exportFrameDurationSetting) {
				console.log(`set frameDuration to ${_exportFrameDurationSetting.value}`);
				setFrameDuration(_exportFrameDurationSetting.value);
			}
			if(_exportFirstFrameHoldDuration) {
				console.log(`set firstFrameHoldDuration to ${_exportFirstFrameHoldDuration.value}`);
				setFirstFrameHoldDuration(_exportFirstFrameHoldDuration.value);
			}
			if(_exportLastFrameHoldDuration) {
				console.log(`set lastFrameHoldDuration to ${_exportLastFrameHoldDuration.value}`);
				setLastFrameHoldDuration(_exportLastFrameHoldDuration.value);
			}
			if(_exportOverlayFrameNumber) {
				console.log(`setOverlayFrameNumberIsChecked = ${_exportOverlayFrameNumber}`);
				setOverlayFrameNumberIsChecked(_exportOverlayFrameNumber.value);
			}
			if(_exportOverlayEntryInfo) {
				console.log(`setOverlayEntryInfoIsChecked = ${_exportOverlayEntryInfo}`);
				setOverlayEntryInfoIsChecked(_exportOverlayEntryInfo.value);
			}
			if(_exportOverlayEntryGraph) {
				console.log(`setOverlayEntryGraphIsChecked = ${_exportOverlayEntryGraph}`);
				setOverlayEntryGraphIsChecked(_exportOverlayEntryGraph.value);
			}
			if(_exportHoldFirstFrame) {
				console.log(`set holdFirstFrame to ${_exportHoldFirstFrame.value}`);
				setHoldFirstFrameIsChecked(_exportHoldFirstFrame.value);
			}
			if(_exportHoldLastFrame) {
				console.log(`set holdLastFrame to ${_exportHoldLastFrame.value}`);
				setHoldLastFrameIsChecked(_exportHoldLastFrame.value);
			}
			setLoadedInitialData(true);
		});
	}, []);

	function loadImageFromBlob(blob:Blob):Promise<HTMLImageElement> {
		return new Promise( (resolve, reject) => {
			const image = new Image();
			const blobUrl = URL.createObjectURL(new Blob([blob.buffer]));
			image.onload = () => {
				URL.revokeObjectURL(blobUrl);
				resolve(image);
			};
			image.src = blobUrl;
		});
	}
	
	const setupD3ChartScales = (entries:Entry[], width: number, height: number) => {
		//TODO: need to improve/clean up data 
		const [minX=0, maxX=0] = d3.extent(entries, d => Date.parse(d.date));
		//setup x axis timeScale
    let x = d3.scaleUtc()
      .domain([minX, maxX])
      .range([margin.left-8, width - margin.right])
			.nice();
    
		//setup y axis linear scale
    let y = d3.scaleLinear()
      .domain(
        [
          (d3.min(entries, d => d.weight) ?? 0),
          (d3.max(entries, d => d.weight) ?? 0)
        ]
      )
      .range([height - margin.bottom, margin.top])
			.nice();

    //let line = d3.line<wlProgressDataWithMetadataMemberType>()
    let line = d3.line<Entry>()
      .x( (d) => x(Date.parse(d.date)) )
      .y( (d) => y(d.weight || 0) );

		return [x, y, line];
	};

	let formatXAxis = (function() {
		let xFormatShort = d3.utcFormat('%b');
		let xFormatLong = d3.utcFormat('%b'); //redundant right now
		let prevYear = 0;
		return (d:any) => {
			if(prevYear !== d.getUTCFullYear()) {
				//console.log('d=',d,'year=',d.getUTCFullYear(),'prevYear=',prevYear);
				prevYear = d.getUTCFullYear();
				return String(d.getUTCFullYear()).substring(2,4);
			}
			return xFormatShort(d).substring(0,1);
		}
	})();

	const handleExportVideo = async () => {
		console.log('handleExportVideo() called');
		if(!entries) {
			setStatusMessages(["Error: Entries not loaded or none found."]);
			console.error('no entries found');
			return;
		}
		setStatusMessages(["begin generating video for export"]);
		//console.log('entries = ');
		//console.dir(entries);
		
		let frameDurationMs = 150;
		let firstFrameHoldDurationMs = 150;
		let lastFrameHoldDurationMs = 150;
		
		if(frameDurationInputRef.current) {
			const frameDurationInputRefValue = parseInt(frameDurationInputRef.current.value as string);
			if(frameDurationInputRefValue) {
				frameDurationMs = clampFrameDuration(frameDurationInputRefValue);
			}
		}
		if(firstFrameHoldDurationInputRef.current) {
			const firstFrameHoldDurationInputRefValue = parseInt(firstFrameHoldDurationInputRef.current.value as string);
			if(firstFrameHoldDurationInputRefValue) {
				firstFrameHoldDurationMs = clampFrameDuration(firstFrameHoldDurationInputRefValue);
			}
		}
		if(lastFrameHoldDurationInputRef.current) {
			const lastFrameHoldDurationInputRefValue = parseInt(lastFrameHoldDurationInputRef.current.value as string);
			if(lastFrameHoldDurationInputRefValue) {
				lastFrameHoldDurationMs = clampFrameDuration(lastFrameHoldDurationInputRefValue);
			}
		}


	 	setStatusMessages( cs => [...cs, `target frameDurationMs = ${frameDurationMs}`]);
		//ensure first entry exists
		if(!(entries[0] && entries[0].alignedImageBlob)) {
			setStatusMessages(["Error: Unable to find first entry data."]);
			return;
		}
		//setup media objects
		const videoCanvas = document.createElement('canvas');
		//const canvasStream = videoCanvas.captureStream(0);
		const canvasStream = videoCanvas.captureStream();
	 	setStatusMessages( cs => [...cs, 'created canvas and canvas stream']);
		const mediaRecorder = new window.MediaRecorder(canvasStream, {
			mimeType: 'video/webm;',
			videoBitsPerSecond: 5000000
		});
		let recorderData:any[] = [];
	 	setStatusMessages( cs => [...cs, 'created MediaRecorder']);
		//setup handler for data available event
		mediaRecorder.ondataavailable = (event) => {
			setStatusMessages( cs => [...cs, `pushed data from mediaRecorder`]);
			console.dir(event)
			recorderData.push(event.data);
		};
		//promisify mediaRecorder onstop handler and attach handler to it to display final video
		let recorderStopped = new Promise( (resolve, reject) => {
			mediaRecorder.onstop = resolve;
		});
		recorderStopped.then( () => {
			setStatusMessages( cs => [...cs, `mediaRecorder stopped`]);
			console.dir(recorderData);
			let recordedBlob = new Blob(recorderData, {type: "video/webm"});
			if(videoElementRef.current) {
				//not recommended practice but for Blobs is currently only woring solution for non-Safari browsers
				videoElementRef.current.src = URL.createObjectURL(recordedBlob);
			}
		});
		//determine scaled image dimensions (720p hardcoded currently)
		let scaledImageWidth = 720;
		let scaledImageHeight = 1280;
		let firstBlob = entries[0].alignedImageBlob;
		if(firstBlob) {
			let firstImage = await loadImageFromBlob(firstBlob);
			//portrait by default 
			const imageRatio = firstImage.naturalHeight/1280;
			scaledImageWidth = firstImage.naturalWidth/imageRatio;
			scaledImageHeight = 1280;
			console.log(`scaledImageWidth = ${firstImage.naturalWidth}/${imageRatio}`);
			if(firstImage.naturalWidth > firstImage.naturalHeight) {
				//landscape
				const imageRatio = firstImage.naturalWidth/1280;
				scaledImageWidth = 1280;
				scaledImageHeight = firstImage.naturalHeight/imageRatio;
			}
			console.log(`videoCanvas.width = ${scaledImageWidth} videoCanvas.height = ${scaledImageHeight}`);
			videoCanvas.width = scaledImageWidth;
			videoCanvas.height = scaledImageHeight;
		}
		
		//setup svg graph overlay 
		const svgWidth = scaledImageWidth - (scaledImageWidth * 0.05);
		const svgHeight = Math.floor(scaledImageHeight/4.5);
		const {x, y, line} = getSVGOverlayAxesAndLine(entries, svgWidth, svgHeight);

		//process frames
		const videoCanvasContext = videoCanvas.getContext('2d');
		console.log(`got video canvas context`);

		//setup intermediate canvas
		const intermediateCanvas = document.createElement('canvas');
		intermediateCanvas.width = scaledImageWidth;
		intermediateCanvas.height = scaledImageHeight;
		const intermediateCanvasContext = intermediateCanvas.getContext('2d');
		
		if(!videoCanvasContext || !intermediateCanvasContext) {
			return;
		}
		
		videoCanvasContext.fillStyle = '#fff';
		videoCanvasContext.font = '32px sans';

		intermediateCanvasContext.fillStyle = '#fff';
		intermediateCanvasContext.font = '32px sans';
		setStatusMessages( cs => [...cs, `start generating frames`]);
		
		for(let c = 0, max = entries.length; c < max; c++) {
		//for(let c = 0, max = 5; c < max; c++) {
			//mediaRecorder.pause();
			//await pauseRecorder();
			//await delay(50);
			let currentBlob = entries[c].alignedImageBlob;
			//load image
			if(currentBlob) {
				console.log(`load image ${c}`);
				const currentImage = await loadImageFromBlob(currentBlob);
				
				//generate scaled version in canvas
				const scaledCanvas = document.createElement('canvas');
				scaledCanvas.width = scaledImageWidth;
				scaledCanvas.height = scaledImageHeight;
				const scaledCanvasContext = scaledCanvas.getContext('2d');
				if(scaledCanvasContext) {
					scaledCanvasContext.drawImage(
						currentImage, 
						0, 
						0, 
						currentImage.naturalWidth, 
						currentImage.naturalHeight, 
						0, 
						0, 
						scaledImageWidth, 
						scaledImageHeight
					);
				}
				console.log(`generated scaledCanvas ${c}`);

				//generate svg graph overlay
		//const svg = document.createElementNS(d3.ns.prefix.svg, 'svg');
		//const svgElem = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const svg = d3.create("svg");

		//setup graph
		configureSVGGraph(svg, svgWidth, svgHeight, margin);
		setupSVGGraphXAxis(svg, svgWidth, svgHeight, margin, x, formatXAxis);
    setupSVGGraphYAxis(svg, y);

		//build line 
    svg.append("path")
      //.data([wlProgressDataWithMetadata])
      .attr("d", line(entries))
      .attr("fill", "none")
      .attr("stroke","white")
      .attr("stroke-width", () => "2")
      .attr("stroke-miterlimit", "1"); 

		//build circle markers
		svg.append("g").selectAll("circle")
    .data(entries)
    .join("circle")
      .attr("fill", (d,i) => { 
				//if(d.cheatDay) { return "darkRed"; }
				return "rgba(0,0,0,0)";
			})
      .attr("stroke", (d,i) => { 
				//if(d.cheatDay) { return "white"; }
				return "rgba(0,0,0,0)";
			})
      .attr("stroke-width", () => '0')
      //.attr("id", (d,i) => "circle_mark_"+d.indexRef)
      .attr("cx", d => x(Date.parse(d.date)))
      .attr("cy", d => y(d.weight || 0))
      .attr("r", (d,i) => { 
				//if(d.cheatDay) { 
				//	return '1.25'; 
				//}
				return '10';
			});

    svg.append("g").selectAll("circle")
    	.data([entries[c]]) //set to for loop index
	    .join("circle")
      	.attr("fill", "none")
	      .attr("stroke", d => {
					//return d.cheatDay ? "darkRed" : "#39e";
					return "#39e";
				})
	      .attr("stroke-width", 3)
	      .attr("cx", d => x(Date.parse(d.date)))
	      .attr("cy", d => y(d.weight || 0))
      	.attr("r", '5');


				console.log(`start draw frame = ${c}`);
				intermediateCanvasContext.clearRect( 0, 0, scaledImageWidth, scaledImageHeight);
				intermediateCanvasContext.drawImage(scaledCanvas, 0, 0);
				if(overlayEntryGraphIsChecked) {
					//const svgNode = svg.node();
					console.log('start draw svg overlay');
					const svgNode = svg.node();
					if(svgNode != null) {
						//console.log(svgNode.outerHTML);
						//console.dir(svg);
						//let svgImage = await drawInlineSVG(svgNode.outerHTML);
						let svgImage = await drawInlineSVG(svgNode);
						const extraTopOffset = overlayEntryInfoIsChecked ? 60 : 0;
						//console.log('got svgImage');
						if(svgImage != null){
							const prevFillStyle:string = intermediateCanvasContext.fillStyle;
							intermediateCanvasContext.fillStyle = 'rgba(0,0,0,0.65)';
							intermediateCanvasContext.fillRect(
								25, 
								margin.top - 20 + extraTopOffset, 
								svgWidth - margin.right + margin.left, 
								svgHeight - margin.bottom
							);
							intermediateCanvasContext.drawImage(svgImage, 50, 0 + extraTopOffset);
							intermediateCanvasContext.fillStyle = prevFillStyle;
						}
					}
				}
				if(overlayFrameNumberIsChecked) {
					const prevFillStyle:string = intermediateCanvasContext.fillStyle;
					intermediateCanvasContext.fillStyle = 'rgba(0, 0, 0, 0.65)';
					intermediateCanvasContext.fillRect(
						scaledImageWidth - 140, 
						scaledImageHeight - 75, 
						110, 50
					);
					intermediateCanvasContext.fillStyle = prevFillStyle;
					intermediateCanvasContext.fillText(
						`${c}`, 
						scaledImageWidth - 130, 
						scaledImageHeight - 40
					);
				}
				if(overlayEntryInfoIsChecked) {
					const prevFillStyle:string = intermediateCanvasContext.fillStyle;
					intermediateCanvasContext.fillStyle = 'rgba(0, 0, 0, 0.65)';
					intermediateCanvasContext.fillRect(
						scaledImageWidth * 0.03, 
						25, 
						scaledImageWidth * 0.94, 
						50
					);
					intermediateCanvasContext.fillStyle = prevFillStyle;
					intermediateCanvasContext.fillText(`${entries[c].weight} lbs on ${entries[c].date}`, 50, 61);
				}
				
				///draw intermediatecanvas onto videocanvas
				videoCanvasContext.clearRect( 0, 0, scaledImageWidth, scaledImageHeight);
				videoCanvasContext.drawImage(intermediateCanvas, 0, 0);
				//additional delay to allow canvas drawing actions to settle
				//discovered via testing that this improves frame drawing time consistency greatly
				//NOTE: further testing revealed that this breaks rendering in some cases, not sure exactly why.
				//commented out for now
				//await delay(50);
				console.log('resume recording');
				if(c == 0) {
					videoCanvasContext.clearRect( 0, 0, scaledImageWidth, scaledImageHeight);
					videoCanvasContext.drawImage(intermediateCanvas, 0, 0);
					mediaRecorder.start();
				} else {
					mediaRecorder.resume();
				}
				const startTime = Date.now();
				//(canvasStream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack).requestFrame();
				if(holdFirstFrameIsChecked && c == 0) {
					//optionally hold first frame longer
					await delay(firstFrameHoldDurationMs);
				} else if(holdLastFrameIsChecked && c == max-1) {
					//optionally hold lastframe longer
					await delay(firstFrameHoldDurationMs);
				} else {
					await delay(frameDurationMs);
				}
				//(canvasStream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack).requestFrame();
				const endTime = Date.now();
//				mediaRecorder.requestData();
				mediaRecorder.pause();
				//await pauseRecorder();
				console.log(`done drawing frame, time to draw = ${endTime - startTime}`);
				setStatusMessages( cs => [...cs, `generated frame: ${c}/${max-1}, actual frame duration = ${endTime - startTime} ms`]);
				setEntriesProcessed(c);
			await delay(frameDurationMs);
			}
		}
		mediaRecorder.resume();
 		videoCanvasContext.clearRect( 0, 0, scaledImageWidth, scaledImageHeight);
		videoCanvasContext.drawImage(intermediateCanvas, 0, 0);
/*		mediaRecorder.resume();
		//(canvasStream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack).requestFrame();
		await delay(frameDurationMs);
		//(canvasStream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack).requestFrame();
		mediaRecorder.pause();
*/
		/*
				videoCanvasContext.clearRect( 0, 0, scaledImageWidth, scaledImageHeight);
				videoCanvasContext.drawImage(intermediateCanvas, 0, 0);
		mediaRecorder.resume();
		//(canvasStream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack).requestFrame();
		await delay(frameDurationMs*5);
		(canvasStream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack).requestFrame();
		mediaRecorder.pause();
		*/
		await delay(500);
		mediaRecorder.stop();
		setVideoIsReady(true);
	};

	let debounceInputTimeout = useRef(0);
	const handleInputChange = async (event:ChangeEvent<HTMLInputElement>) => {
		console.group('handleInputChange() called');
		if(
			event.target
			&& event.target instanceof HTMLInputElement
			&& event.target.dataset.settingsKeyToModify
		) {
			let newValue:string|boolean|number = event.target.value as string;
			let settingsKeyToModify = event.target.dataset.settingsKeyToModify;
			console.log('settingsKeyToModify = ', settingsKeyToModify);
			if(event.target.dataset.settingsKeyToModify === 'exportFrameDuration') {
				newValue = parseInt(newValue);
				console.log('value = ', newValue);
				setFrameDuration(newValue);
			} else if(event.target.dataset.settingsKeyToModify === 'exportFirstFrameHoldDuration') {
				newValue = parseInt(newValue);
				console.log('value = ', newValue);
				setFirstFrameHoldDuration(newValue);
			} else if(event.target.dataset.settingsKeyToModify === 'exportLastFrameHoldDuration') {
				newValue = parseInt(newValue);
				console.log('value = ', newValue);
				setLastFrameHoldDuration(newValue);
			} else if(event.target.dataset.settingsKeyToModify === 'exportOverlayFrameNumber') {
				let isChecked:boolean = event.target.checked;
				console.log('checked? = ', isChecked);
				(isChecked === true) ? setOverlayFrameNumberIsChecked(true) : setOverlayFrameNumberIsChecked(false);
				newValue = isChecked;
				console.log('value = ', newValue);
			} else if(event.target.dataset.settingsKeyToModify === 'exportOverlayEntryInfo') {
				let isChecked:boolean = event.target.checked;
				console.log('checked? = ', isChecked);
				(isChecked === true) ? setOverlayEntryInfoIsChecked(true) : setOverlayEntryInfoIsChecked(false);
				newValue = isChecked;
				console.log('value = ', newValue);
			} else if(event.target.dataset.settingsKeyToModify === 'exportOverlayEntryGraph') {
				let isChecked:boolean = event.target.checked;
				console.log('checked? = ', isChecked);
				(isChecked === true) ? setOverlayEntryGraphIsChecked(true) : setOverlayEntryGraphIsChecked(false);
				newValue = isChecked;
				console.log('value = ', newValue);
			} else if(event.target.dataset.settingsKeyToModify === 'exportHoldFirstFrame') {
				let isChecked:boolean = event.target.checked;
				console.log('checked? = ', isChecked);
				(isChecked === true) ? setHoldFirstFrameIsChecked(true) : setHoldFirstFrameIsChecked(false);
				newValue = isChecked;
				console.log('value = ', newValue);
			} else if(event.target.dataset.settingsKeyToModify === 'exportHoldLastFrame') {
				let isChecked:boolean = event.target.checked;
				console.log('checked? = ', isChecked);
				(isChecked === true) ? setHoldLastFrameIsChecked(true) : setHoldLastFrameIsChecked(false);
				newValue = isChecked;
				console.log('value = ', newValue);
			}
			clearTimeout(debounceInputTimeout.current);
			let modifyDbValueHandler = async () => {
					console.log('fire update db with new input', newValue, settingsKeyToModify);
						try {
							const id = await db.settings.put(
								{ key: settingsKeyToModify, value: newValue }, 
							);
							console.log('new id =', id);
						} catch(error) {
							console.error(`failed to add db entry. ${error}`);
						}
			};
			debounceInputTimeout.current = window.setTimeout( modifyDbValueHandler, 500);
		}
		console.groupEnd();
	};
	

	//<p>Estimated video duration: { frameDuration && entries ? `${(frameDuration*entries.length/1000)} seconds` : 'N/A'}</p>

	let estimatedVideoDurationString = 'N/A';
	if(entries && frameDuration) {
		let estimatedVideoDurationSeconds = frameDuration*entries.length/1000;
		if(holdFirstFrameIsChecked && firstFrameHoldDuration) {
			estimatedVideoDurationSeconds = (estimatedVideoDurationSeconds - (frameDuration/1000)) + (firstFrameHoldDuration/1000);
		}
		if(holdLastFrameIsChecked && lastFrameHoldDuration) {
			estimatedVideoDurationSeconds = (estimatedVideoDurationSeconds - (frameDuration/1000)) + (lastFrameHoldDuration/1000);
		}
		const minutes = Math.floor(estimatedVideoDurationSeconds/60);
		const minutesLabel = minutes != 1 ? 'minutes' : 'minute';
		const seconds = estimatedVideoDurationSeconds % 60;
		const secondsLabel = seconds != 1 ? 'seconds' : 'second';
		if(estimatedVideoDurationSeconds < 60) {
			estimatedVideoDurationString = `${seconds.toFixed(2)} ${secondsLabel}`;
		} else {
			estimatedVideoDurationString = `${minutes.toFixed(0)} ${minutesLabel} and ${seconds.toFixed(2)} ${secondsLabel}`;
		}
	}

	const allRelevantValidationsPassed = 
		validationResults.moreThanZeroEntries
		&& validationResults.allEntriesHaveImageBlob
		&& validationResults.allEntriesHaveAlignedImageBlob 
		&& validationResults.allEntriesHaveDate
		&& validationResults.allEntriesHaveWeight
		&& validationResults.allEntriesHaveAllMarks
		&& validationResults.adjustmentImageCropAndScalingChosen;

	return (
		<>
			<div className="columns is-mobile is-centered">
				<div className="column is-12">
					<div className="hero is-small is-primary">
						<div className="hero-body">
    					<h2 className="title">Export Time-lapse</h2>
							<p className="subtitle">Multiple options for exporting the final time-lapse.</p>
						</div>
					</div>
				</div>
			</div>
			<div className="columns is-mobile is-centered">
				<div className="column is-10-mobile is-8-tablet is-4-desktop">
					<EntriesValidator
						validationResults={validationResults}
						setValidationResults={setValidationResults}
						showOnlyErrors={true}
						displayOnlyTheseValidations={[
							'moreThanZeroEntries',
							'allEntriesHaveImageBlob',
							'allEntriesHaveAlignedImageBlob',
							'allEntriesHaveDate',
							'allEntriesHaveWeight',
							'allEntriesHaveAllMarks',
							'adjustmentImageCropAndScalingChosen'
						]}
					/>
				</div>
			</div>
			<div className="columns is-mobile is-centered">
				<div className="column is-11-mobile is-10-tablet is-8-desktop">
  				<div>
						{
							Object.keys(validationResults).length > 0 &&
							!allRelevantValidationsPassed && 
				<div className="message is-danger">
					<div className="message-body">
							<p>There are validation errors that must be fixed before a timelapse can be exported.</p>
						</div>
						</div>
						}
						{
							allRelevantValidationsPassed && 
							!loadedInitialData && 
							<>
								<p>Loading...</p>
							</>
						}
						{ 
							//allRelevantValidationsPassed && 
							//loadedInitialData && 
						}
						{
							true && 
							<>
							<div className="box">
								<h2 className="title is-5">Export Video Locally (Experimental)</h2>
								<p className="mb-5">Exports video of progress pictures completely in-browser and local to your device. Currently not very consistent at low frame durations (faster timelapse). Export occurs in real-time.</p>
							<div>
							<div className="columns">
								<div className="column is-12">
									<div className="field">
										<label className="label">Frame Duration (ms)</label>
										<div className="control">
											<input
												ref={frameDurationInputRef}
												type="number"
												className="input"
												value={frameDuration}
												onChange={handleInputChange}
												data-settings-key-to-modify="exportFrameDuration" 
												max={MAX_FRAME_DURATION_MS}
												min={MIN_FRAME_DURATION_MS}
											/>
										</div>
									</div>
								</div>
							</div>
							<div className="columns is-multiline">
								<div className="column is-narrow">
							
							<div className="columns is-mobile">
								<div className="column is-narrow">
									<div className="field">
										<label className="label">Hold First Frame?</label>
										<div className="control">
											<div className="checkbox">
												<input
													ref={holdFirstFrameInputRef}
													type="checkbox"
													value="true"
													checked={holdFirstFrameIsChecked}
													onChange={handleInputChange}
													data-settings-key-to-modify="exportHoldFirstFrame" 
												/>
											</div>
										</div>
									</div>
								</div>
								<div className="column">
									<div className="field">
										<label className="label">First Frame Hold Duration (ms)</label>
										<div className="control">
											<input
												ref={firstFrameHoldDurationInputRef}
												type="number"
												className="input"
												value={firstFrameHoldDuration}
												onChange={handleInputChange}
												data-settings-key-to-modify="exportFirstFrameHoldDuration" 
												max={MAX_FRAME_DURATION_MS}
												min={MIN_FRAME_DURATION_MS}
											/>
										</div>
									</div>
								</div>
							</div>

						</div>
								<div className="column is-narrow">

							<div className="columns is-mobile">
								<div className="column is-narrow">
									<div className="field">
										<label className="label">Hold Last Frame?</label>
										<div className="control">
											<div className="checkbox">
												<input
													ref={holdLastFrameInputRef}
													type="checkbox"
													value="true"
													checked={holdLastFrameIsChecked}
													onChange={handleInputChange}
													data-settings-key-to-modify="exportHoldLastFrame" 
												/>
											</div>
										</div>
									</div>
								</div>
								<div className="column">
									<div className="field">
										<label className="label">Last Frame Hold Duration (ms):</label>
										<div className="control">
											<input
												ref={lastFrameHoldDurationInputRef}
												type="number"
												className="input"
												value={lastFrameHoldDuration}
												onChange={handleInputChange}
												data-settings-key-to-modify="exportLastFrameHoldDuration" 
												max={MAX_FRAME_DURATION_MS}
												min={MIN_FRAME_DURATION_MS}
											/>
										</div>
									</div>
								</div>
							</div>
					</div>

					</div>
					</div>

							<div className="columns is-mobile">
								<div className="column">
									<div className="field">
										<label className="label">Overlay Frame Number?</label>
										<div className="control">
											<div className="checkbox">		
												<input
													ref={overlayFrameNumberInputRef}
													type="checkbox"
													value="true"
													checked={overlayFrameNumberIsChecked}
													onChange={handleInputChange}
													data-settings-key-to-modify="exportOverlayFrameNumber" 
												/>
											</div>
										</div>
										<p className="help">Frame number in bottom right corner.</p>
									</div>
								</div>
								<div className="column">
									<div className="field">
										<label className="label">Overlay Entry Information?</label>
										<div className="control">
											<div className="checkbox">		
												<input
													ref={overlayEntryInfoInputRef}
													type="checkbox"
													value="true"
													checked={overlayEntryInfoIsChecked}
													onChange={handleInputChange}
													data-settings-key-to-modify="exportOverlayEntryInfo" 
											/>
											</div>
										</div>
										<p className="help">Weight and date information at top center..</p>
									</div>
								</div>
								<div className="column">
									<div className="field">
										<label className="label">Overlay Entry Graph?</label>
										<div className="control">
											<div className="checkbox">		
												<input
													ref={overlayEntryGraphInputRef}
													type="checkbox"
													value="true"
													checked={overlayEntryGraphIsChecked}
													onChange={handleInputChange}
													data-settings-key-to-modify="exportOverlayEntryGraph" 
											/>
											</div>
										</div>
										<p className="help">Graph with weight on x-axis and date on y-axis.</p>
									</div>
								</div>
							</div>
							<div className="columns">
								<div className="column">
					<p>Estimated video duration: {estimatedVideoDurationString}</p>
								</div>
							</div>
							<div className="columns">
								<div className="column">
					
									<div className="field">
										<div className="control">
					<button
						type="button"
						className="button is-primary"
						onClick={handleExportVideo}
					>
						Export Video
					</button>
					</div>
					</div>
					</div>
					</div>
							<div className="columns">
								<div className="column">
									<div className="field">
					<label className="label">Export Progress</label>
						
										<div className="control">
						<progress 
							className="progress is-info"
							max={entries ? entries?.length-1 : 0}
							value={entriesProcessed}
						>
							{entriesProcessed} entries processed out of {entries ? entries?.length-1 : 0}
						</progress>
					</div>
					</div>
					</div>
					</div>
							<div className="columns">
								<div className="column">
									<div className="field">
					<label className="label">Export Log</label>
										<div className="control">
					<textarea
						className="textarea"
						defaultValue={
							statusMessages?.slice(0).reverse().reduce( (accumulator, curMessage) => {
								return accumulator + curMessage + '\n';
							}, '')
						}
					>
					</textarea>
					</div>
					</div>
					</div>
					</div>
					<hr/>
					<h2 className="title is-5">Output Video</h2>
					<video 
						ref={videoElementRef} 
						controls 
						width="350"
						style={{
							visibility: (videoIsReady ? 'visible' : 'hidden'),
							height: (videoIsReady ? 'auto' : '0px')
						}}
					> 
					</video>
				</div>
				<div className="box">
					<h2 className="title is-5">Export Video Server-side</h2>
					<p><i>Not yet implemented.</i></p>
				</div>
				<div className="box">
					<h2 className="title is-5">Upload Interactive Viewer</h2>
					<p><i>Not yet implemented.</i></p>
				</div>
				<div className="box">
					<h2 className="title is-5">Export/Import Raw Data</h2>
					<p className="mb-5">Since your data is only stored locally on your device, it could be deleted if your browser's IndexedDB storage gets cleared. If you want to ensure your data is safe, use the following options to export the raw data and, if needed, to import previously exported raw data.</p>
					<div className="columns">
						<div className="column is-narrow">					
							<div className="field">
								<label className="label">Export</label>
								<button 
									type="button"
									className={`button ${ exportDbDataInProgress ? 'is-loading' : '' }`}
									onClick={async () => {
										setExportDbDataInProgress(true);
										await handleExportDbButtonClick(setExportDbDataRowsExported, setExportDbDataMaxRows)
										setExportDbDataInProgress(false);
									}}
								>
									Export Data
								</button>
							</div>
						</div>
						<div className="column">
							<div className="field">
								<label className="label">Data Export Progress</label>
								<div className="control">
									<progress 
										className="progress is-info"
										max={exportDbDataMaxRows ? exportDbDataMaxRows : 0}
										value={exportDbDataRowsExported}
									>
										{exportDbDataRowsExported} rows exported out of {exportDbDataMaxRows ? exportDbDataMaxRows : 0}
									</progress>
								</div>
							</div>
						</div>
					</div>
					<div className="columns">
						<div className="column is-narrow">
							<div className="field">
								<label className="label">Import</label>
								<div 
									ref={dbDataFileUploadContainerRef}
									className="file is-boxed has-name"
								>
									<label className="file-label">
										<input 
											ref={dbDataFileUploadRef} 
											type="file"
											className="file-input"
										/>
										<span className="file-cta">
											<FontAwesomeIcon icon={faUpload}/>
											<span className="file-label">
												Select data file...
											</span>
										</span>
										<span ref={dbDataFileUploadFileNameRef} className="file-name"></span>
									</label>
								</div>
							</div>
						</div>
						<div className="column">
							<div className="field">
								<label className="label">Data Import Progress</label>
								<div className="control">
									<progress 
										className="progress is-info"
										max={importDbDataMaxRows ? importDbDataMaxRows : 0}
										value={importDbDataRowsImported}
									>
										{importDbDataRowsImported} rows exported out of {importDbDataMaxRows ? importDbDataMaxRows : 0}
									</progress>
								</div>
							</div>
							<p>Import Status: {importDbDataStatus}</p>
						</div>
					</div>
					<p><i>Not yet implemented.</i></p>
				</div>
				</>
			}
		</div>
		</div>
		</div>
		</>
  );
}

export default Export;
