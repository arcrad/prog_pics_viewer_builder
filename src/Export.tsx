import React, { useState, useRef, useEffect, Dispatch, SetStateAction, ChangeEvent } from 'react';
import  * as mathjs  from 'mathjs';
import * as PIXI from 'pixi.js';

import * as d3 from 'd3';
import { ScaleTime, ScaleLinear } from 'd3-scale'; //from DefinitelyTyped types
import { Line } from 'd3-shape'; //from DefinitelyTyped types

//importi './Viewer.css';
import { db, Entry, Setting } from './db';
import { GlobalState } from './App';
import EntriesValidator,  { ValidationResults, defaultValidationResults } from './EntriesValidator';

//import './Export.css';

type ExportAttributes = {
	globalState: GlobalState;
	setGlobalState: Dispatch<SetStateAction<GlobalState>>;
}

const margin = { top: 50, right: 50, bottom: 10, left: 50 };
const defaultChartDimensions = { width: 900, height: 250 };
const smallScreenBreakpoint = 700;

const MIN_FRAME_DURATION_MS = 5;
const MAX_FRAME_DURATION_MS = 5000;

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
    const _x = d3.scaleUtc()
      .domain([minX, maxX])
      .range([margin.left - 25, svgWidth - margin.right])
			.nice(); 
		//setup y axis linear scale
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

function Export({
	globalState,
	setGlobalState
}: ExportAttributes) { 
	let [loadedInitialData, setLoadedInitialData] = useState<boolean>(false);
	let [statusMessages, setStatusMessages] = useState<string[]>([]);
	let [videoIsReady, setVideoIsReady] = useState<boolean>(false);
	let [entries, setEntries] = useState<Entry[]|null>(null);
	let [entriesProcessed, setEntriesProcessed] = useState(0);
	let [validationResults, setValidationResults] = useState<ValidationResults>(defaultValidationResults);
	let [frameDuration, setFrameDuration] = useState<number>(150);
	let [overlayFrameNumberIsChecked, setOverlayFrameNumberIsChecked] = useState<boolean>(false);
	let [overlayEntryInfoIsChecked, setOverlayEntryInfoIsChecked] = useState<boolean>(false);
	let [firstFrameHoldDuration, setFirstFrameHoldDuration] = useState<number>(150);
	let [lastFrameHoldDuration, setLastFrameHoldDuration] = useState<number>(150);
	let [holdFirstFrameIsChecked, setHoldFirstFrameIsChecked] = useState<boolean>(false);
	let [holdLastFrameIsChecked, setHoldLastFrameIsChecked] = useState<boolean>(false);

	const initializedRef = useRef<boolean>(false);
	const videoElementRef = useRef<HTMLVideoElement|null>(null);
	const videoSourceElementRef = useRef<HTMLSourceElement|null>(null);
	const frameDurationInputRef = useRef<HTMLInputElement|null>(null);
	const overlayFrameNumberInputRef = useRef<HTMLInputElement|null>(null);
	const overlayEntryInfoInputRef = useRef<HTMLInputElement|null>(null);
	const holdFirstFrameInputRef = useRef<HTMLInputElement|null>(null);
	const holdLastFrameInputRef = useRef<HTMLInputElement|null>(null);
	const firstFrameHoldDurationInputRef = useRef<HTMLInputElement|null>(null);
	const lastFrameHoldDurationInputRef = useRef<HTMLInputElement|null>(null);

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
			db.settings.get('exportHoldFirstFrame'),
			db.settings.get('exportHoldLastFrame'),
		]).then( ([
			_entries,
			_exportFrameDurationSetting,
			_exportFirstFrameHoldDuration,
			_exportLastFrameHoldDuration,
			_exportOverlayFrameNumber,
			_exportOverlayEntryInfo,
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
			const blobUrl = URL.createObjectURL(blob);
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
		const svgHeight = Math.floor(scaledImageHeight/4);
		const {x, y, line} = getSVGOverlayAxesAndLine(entries, svgWidth, svgHeight);

		//process frames
		const videoCanvasContext = videoCanvas.getContext('2d');
		console.log(`got video canvas context`);

		const intermediateCanvas = document.createElement('canvas');
		intermediateCanvas.width = scaledImageWidth;
		intermediateCanvas.height = scaledImageHeight;
		const intermediateCanvasContext = intermediateCanvas.getContext('2d');
		
		if(!videoCanvasContext || !intermediateCanvasContext) {
			return;
		}
		
		videoCanvasContext.fillStyle = 'red';
		videoCanvasContext.font = '42px serif';

		intermediateCanvasContext.fillStyle = 'red';
		intermediateCanvasContext.font = '42px serif';
	/*
		const pauseRecorder = ():Promise<void> => {
			return new Promise( (resolve) => {
				console.log(`media recorder state = ${mediaRecorder.state}`);
				console.log('pause requested');
				if(mediaRecorder.state == 'paused') {
					console.log('already paused, doing nothing');
					resolve();
				} else {
					mediaRecorder.onpause = () => {
						console.log('pause event fired');
						resolve();
					}
					console.log('pause() called');
					mediaRecorder.pause();
				}
			});
		};
*/
		//await pauseRecorder();
		/*
		console.log('fill rect called');
		videoCanvasContext.fillStyle = 'blue';
		videoCanvasContext.fillRect( 0, 0, scaledImageWidth, scaledImageHeight);
		await delay(1000);
		videoCanvasContext.fillStyle = 'red';
		console.log('fill rect 2 called');
		videoCanvasContext.fillRect( 0, 0, scaledImageWidth, scaledImageHeight);
		await delay(1000);
		videoCanvasContext.fillStyle = 'green';
		videoCanvasContext.fillRect( 0, 0, scaledImageWidth, scaledImageHeight);
		await delay(1000);
		videoCanvasContext.fillRect( 0, 0, scaledImageWidth, scaledImageHeight);
		videoCanvasContext.fillStyle = 'red';
		mediaRecorder.start();
		await delay(3000);
*/
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
    const svg = d3
			.create("svg");

		svg
    //const svg = d3.select(svgElem)
      .attr("width", svgWidth + margin.left + margin.right)
      .attr("height", svgHeight + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);
    
		svg
			.append("g")
			.attr("class","graphAxis")
			.attr("transform", `translate(0, ${svgHeight-margin.bottom+1})`)
			.attr("color","white")
			//.call(d3.axisBottom(x).ticks(undefined, '%b'));//d3.utcFormat('%b %d')));
			//.call(d3.axisBottom(x).ticks(undefined).tickFormat(formatXAxis));
			.call(d3.axisBottom(x).tickFormat((d) => formatXAxis(d)));
			//.call(d3.axisBottom(x));

    svg
			.append("g")
			.attr("class","graphAxis")
			.attr("transform", `translate(10, 0)`)
			.attr("color","white")
			.call(d3.axisLeft(y));
    
		//build line 
    svg.append("path")
      //.data([wlProgressDataWithMetadata])
      .attr("d", line(entries))
      .attr("fill", "none")
      .attr("stroke","white")
      .attr("stroke-width", () => '1')
      .attr("stroke-miterlimit","1"); 

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
				return '2';
			});

    svg.append("g").selectAll("circle")
    	.data([entries[1]]) //set to for loop index
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
				if(overlayFrameNumberIsChecked) {
					intermediateCanvasContext.fillText(`FRAME: ${c}`, 10, 50);
				}
				if(overlayEntryInfoIsChecked) {
					//intermediateCanvasContext.fillText(`Weight ${entries[c].weight} lbs`, 10, 100);
					//intermediateCanvasContext.fillText(`Date ${entries[c].date}`, 10, 150);
					//const svgNode = svg.node();
					console.log('start draw svg overlay');
					const svgNode = svg.node();
					if(svgNode != null) {
						//console.log(svgNode.outerHTML);
						//console.dir(svg);
						//let svgImage = await drawInlineSVG(svgNode.outerHTML);
						let svgImage = await drawInlineSVG(svgNode);
						//console.log('got svgImage');
						if(svgImage != null){
							const prevFillStyle:string = intermediateCanvasContext.fillStyle;
							intermediateCanvasContext.fillStyle = 'rgba(0,0,0,0.5)';
							intermediateCanvasContext.fillRect(25, margin.top - 10, svgWidth - margin.right+margin.left, svgHeight - margin.bottom);
							intermediateCanvasContext.drawImage(svgImage, 50, 0);
							intermediateCanvasContext.fillStyle = prevFillStyle;
						}
					}
				}
				
				///draw intermediatecanvas onto videocanvas
				/*
				videoCanvasContext.clearRect( 0, 0, scaledImageWidth, scaledImageHeight);
				videoCanvasContext.drawImage(intermediateCanvas, 0, 0);
				*/
				videoCanvasContext.clearRect( 0, 0, scaledImageWidth, scaledImageHeight);
				videoCanvasContext.drawImage(intermediateCanvas, 0, 0);
				//additional delay to allow canvas drawing actions to settle
				//discovered via testing that this improves frame drawing time consistency greatly
				//NOTE: further testing revealed that this breaks rendering in some cases, not sure exactly why. commented out for now
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
			estimatedVideoDurationString = `${minutes.toFixed(2)} ${minutesLabel} and ${seconds.toFixed(2)} ${secondsLabel}`;
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
  	<div>
    	<h2>Export Time-lapse</h2>
			<p>Multiple options for exporting the final time-lapse.</p>
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
			{
				!allRelevantValidationsPassed && 
				<p>There are validation errors that must be fixed before a timelapse can be exported.</p>
			}
			{
				allRelevantValidationsPassed && 
				!loadedInitialData && 
				<>
					<p>Loading...</p>
				</>
			}
			{ 
				allRelevantValidationsPassed && 
				loadedInitialData && 
				<>
    			<h2>Export Video Locally (Experimental)</h2>
					<p>Exports video of progress pictures completely in-browser and local to your device. Currently not very consistent at low frame durations (faster timelapse). Export occurs in real-time.</p>
					<label> Frame Duration (ms):
					<input
						ref={frameDurationInputRef}
						type="number"
						value={frameDuration}
						onChange={handleInputChange}
						data-settings-key-to-modify="exportFrameDuration" 
						max={MAX_FRAME_DURATION_MS}
						min={MIN_FRAME_DURATION_MS}
					/>
					</label><br/>
					
					
					<label>Hold First Frame?:
					<input
						ref={holdFirstFrameInputRef}
						type="checkbox"
						value="true"
						checked={holdFirstFrameIsChecked}
						onChange={handleInputChange}
						data-settings-key-to-modify="exportHoldFirstFrame" 
					/>
					</label>
					<label> First Frame Hold Duration (ms):
					<input
						ref={firstFrameHoldDurationInputRef}
						type="number"
						value={firstFrameHoldDuration}
						onChange={handleInputChange}
						data-settings-key-to-modify="exportFirstFrameHoldDuration" 
						max={MAX_FRAME_DURATION_MS}
						min={MIN_FRAME_DURATION_MS}
					/>
					</label><br/>
					<label>Hold Last Frame?:
					<input
						ref={holdLastFrameInputRef}
						type="checkbox"
						value="true"
						checked={holdLastFrameIsChecked}
						onChange={handleInputChange}
						data-settings-key-to-modify="exportHoldLastFrame" 
					/>
					</label>
					<label> Last Frame Hold Duration (ms):
					<input
						ref={lastFrameHoldDurationInputRef}
						type="number"
						value={lastFrameHoldDuration}
						onChange={handleInputChange}
						data-settings-key-to-modify="exportLastFrameHoldDuration" 
						max={MAX_FRAME_DURATION_MS}
						min={MIN_FRAME_DURATION_MS}
					/>
					</label><br/>
					<label>Overlay Frame Number?:
					<input
						ref={overlayFrameNumberInputRef}
						type="checkbox"
						value="true"
						checked={overlayFrameNumberIsChecked}
						onChange={handleInputChange}
						data-settings-key-to-modify="exportOverlayFrameNumber" 
					/>
					</label><br/>
					<label>Overlay Entry Information?:
					<input
						ref={overlayEntryInfoInputRef}
						type="checkbox"
						value="true"
						checked={overlayEntryInfoIsChecked}
						onChange={handleInputChange}
						data-settings-key-to-modify="exportOverlayEntryInfo" 
					/>
					</label><br/>
					<p>Estimated video duration: {estimatedVideoDurationString}</p>
					<button
						type="button"
						onClick={handleExportVideo}
					>
						Export Video
					</button><br/>
					<label>Progress&nbsp;
						<progress max={entries ? entries?.length-1 : 0} value={entriesProcessed}>
							{entriesProcessed} entries processed out of {entries ? entries?.length-1 : 0}
						</progress>
					</label>
					<p>Status:</p>
					<div style={{
						border: '1px solid black',
						padding: '0rem',
						height: '5rem',
						overflow: 'auto scroll'
					}}>
						<ul>
						{
							statusMessages?.slice(0).reverse().map( (message, index) => {
								return <li key={index}>{message}</li>
							})
						}
						</ul>
					</div>
					<hr/>
					<h2>Output Video</h2>
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
					<hr/>
					<h2>Export Video Server-side</h2>
					<p><i>Not yet implemented.</i></p>
					<hr/>
					<h2>Upload Interactive Viewer</h2>
					<p><i>Not yet implemented.</i></p>
				</>
			}
		</div>
  );
}

export default Export;
