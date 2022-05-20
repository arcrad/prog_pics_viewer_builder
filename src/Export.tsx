import React, { useState, useRef, useEffect, Dispatch, SetStateAction, ChangeEvent } from 'react';
import  * as mathjs  from 'mathjs';
import * as PIXI from 'pixi.js';

import * as d3 from 'd3';
import { ScaleTime, ScaleLinear } from 'd3-scale'; //from DefinitelyTyped types
import { Line } from 'd3-shape'; //from DefinitelyTyped types

//importi './Viewer.css';
import { db, Entry, Setting } from './db';
import { GlobalState } from './App';
//import './Export.css';

type ExportAttributes = {
	globalState: GlobalState;
	setGlobalState: Dispatch<SetStateAction<GlobalState>>;
}

const margin = { top: 5, right: 15, bottom: 15, left: 30 };
const defaultChartDimensions = { width: 900, height: 250 };
const smallScreenBreakpoint = 700;

const MIN_FRAME_DURATION_MS = 50;
const MAX_FRAME_DURATION_MS = 5000;

function Export({
	globalState,
	setGlobalState
}: ExportAttributes) { 
	let [statusMessages, setStatusMessages] = useState<string[]>([]);
	let [frameDuration, setFrameDuration] = useState<number>(150);
	let [videoIsReady, setVideoIsReady] = useState<boolean>(false);
	let [overlayFrameNumberIsChecked, setOverlayFrameNumberIsChecked] = useState<boolean>(false);
	let [overlayEntryInfoIsChecked, setOverlayEntryInfoIsChecked] = useState<boolean>(false);
	let [entries, setEntries] = useState<Entry[]|null>(null);
	let [entriesProcessed, setEntriesProcessed] = useState(0);

	const initializedRef = useRef<boolean>(false);
	const videoElementRef = useRef<HTMLVideoElement|null>(null);
	const videoSourceElementRef = useRef<HTMLSourceElement|null>(null);
	const frameDurationInputRef = useRef<HTMLInputElement|null>(null);
	const overlayFrameNumberInputRef = useRef<HTMLInputElement|null>(null);
	const overlayEntryInfoInputRef = useRef<HTMLInputElement|null>(null);

	useEffect( () => {
		if(initializedRef.current) {
			return;
		}
		console.log('intialize data from DB started');
		initializedRef.current = true;
		Promise.all([
		  db.entries.orderBy('date').filter((entry) => entry.draft !== true).toArray(),
			db.settings.get('exportFrameDuration'),
			db.settings.get('exportOverlayFrameNumber'),
			db.settings.get('exportOverlayEntryInfo')
		]).then( ([
			_entries,
			_exportFrameDurationSetting,
			_exportOverlayFrameNumber,
			_exportOverlayEntryInfo
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
			if(_exportOverlayFrameNumber) {
				console.log(`setOverlayFrameNumberIsChecked = ${_exportOverlayFrameNumber}`);
				setOverlayFrameNumberIsChecked(_exportOverlayFrameNumber.value);
			}
			if(_exportOverlayEntryInfo) {
				console.log(`setOverlayEntryInfoIsChecked = ${_exportOverlayEntryInfo}`);
				setOverlayEntryInfoIsChecked(_exportOverlayEntryInfo.value);
			}
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
		//let x:(ScaleTime<number, number, never>|any) = 0;
		//let y:(ScaleLinear<number, number, never>|any) = 
		//TODO: need to improve data 
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
		if(frameDurationInputRef.current) {
			const frameDurationInputRefValue = parseInt(frameDurationInputRef.current.value as string);
			if(frameDurationInputRefValue) {
				frameDurationMs = frameDurationInputRefValue < MIN_FRAME_DURATION_MS ? 
					MIN_FRAME_DURATION_MS 
					: 
					frameDurationInputRefValue > MAX_FRAME_DURATION_MS ? 
						MAX_FRAME_DURATION_MS
						: 
						frameDurationInputRefValue;
			}
		}
	 	setStatusMessages( cs => [...cs, `target frameDurationMs = ${frameDurationMs}`]);
		//setup media objects
		if(!(entries[0] && entries[0].alignedImageBlob)) {
			setStatusMessages(["Error: Unable to find first entry data."]);
			return;
		}
		const videoCanvas = document.createElement('canvas');
	 	setStatusMessages( cs => [...cs, 'created MediaStream']);
		const canvasStream = videoCanvas.captureStream(0);
		const mediaRecorder = new window.MediaRecorder(canvasStream, {
			mimeType: 'video/webm;',
			videoBitsPerSecond: 5000000
		});
		let recorderData:any[] = [];
	 	setStatusMessages( cs => [...cs, 'created MediaRecorder']);

		mediaRecorder.ondataavailable = (event) => {
			setStatusMessages( cs => [...cs, `pushed data from mediaRecorder`]);
			console.dir(event)
			recorderData.push(event.data);
		};
		
		let recorderStopped = new Promise( (resolve, reject) => {
			mediaRecorder.onstop = resolve;
		});
		
		recorderStopped.then( () => {
			setStatusMessages( cs => [...cs, `mediaRecorder stopped`]);
			console.dir(recorderData);
			let recordedBlob = new Blob(recorderData, {type: "video/webm"});
			if(videoElementRef.current) {
				//not recommended praactice but for Blobs is currently only woring solution for non-Safari browsers
				videoElementRef.current.src = URL.createObjectURL(recordedBlob);
			}
		});
		
		//determine scaled image dimensions (720p hardcoded currently)
		let scaledImageWidth = 720;
		let scaledImageHeight = 1280;
		let firstBlob = entries[0].alignedImageBlob;
		if(firstBlob) {
			let firstImage = await loadImageFromBlob(firstBlob);
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
		
		const delay = (ms:number) => new Promise( (resolve) => setTimeout(resolve, ms) );

		//setup d3
		//const [x, y, line] = setupD3ChartScales(entries, scaledImageWidth, scaledImageHeight);
		
		const [minX=0, maxX=0] = d3.extent(entries, d => Date.parse(d.date));
		//setup x axis timeScale
    let x = d3.scaleUtc()
      .domain([minX, maxX])
      .range([margin.left-8, scaledImageWidth - margin.right])
			.nice();
    
		//setup y axis linear scale
    let y = d3.scaleLinear()
      .domain(
        [
          (d3.min(entries, d => d.weight) ?? 0),
          (d3.max(entries, d => d.weight) ?? 0)
        ]
      )
      .range([scaledImageHeight - margin.bottom, margin.top])
			.nice();

    //let line = d3.line<wlProgressDataWithMetadataMemberType>()
    let line = d3.line<Entry>()
      .x( (d) => x(Date.parse(d.date)) )
      .y( (d) => y(d.weight || 0) );
		
		/*
		d3.select("#graphContainer").selectAll("*").remove();
		
    const svg = d3
      .select("#graphContainer")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);
		*/

    const svg = d3
			.create("svg")
      .attr("width", scaledImageWidth + margin.left + margin.right)
      .attr("height", scaledImageHeight + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);
    
		svg
			.append("g")
			.attr("class","graphAxis")
			.attr("transform", `translate(0, ${scaledImageHeight-margin.bottom+1})`)
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
				/*if(d.cheatDay) { 
					return '1.25'; 
				}*/
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
		/*
	  svg.on('click', (event, d) => {
			//console.log('event=',event);
			let eventTargetIndexRef = event?.target?.__data__?.indexRef;
			if(event.target.localName === 'circle' && eventTargetIndexRef > -1) {
				//console.log('indexRef=',eventTargetIndexRef);
				handleXIndexUpdate(xIndex, eventTargetIndexRef ?? 0);
			}
		});
		*/










		//process frames
		const videoCanvasContext = videoCanvas.getContext('2d');
		console.log(`got video canvas context`);
		if(!videoCanvasContext) {
			return;
		}
		videoCanvasContext.fillStyle = 'red';
		videoCanvasContext.font = '42px serif';
		mediaRecorder.start();
		for(let c = 0, max = entries.length; c < max; c++) {
			mediaRecorder.pause();
			//await delay(50);
			await delay(50);
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
				console.log('started recording');
				console.log(`start draw frame = ${c}`);
				videoCanvasContext.clearRect( 0, 0, scaledImageWidth, scaledImageHeight);
				videoCanvasContext.drawImage(scaledCanvas, 0, 0);
				if(overlayFrameNumberIsChecked) {
					videoCanvasContext.fillText(`FRAME: ${c}`, 10, 50);
				}
				if(overlayEntryInfoIsChecked) {
					videoCanvasContext.fillText(`Weight ${entries[c].weight} lbs`, 10, 100);
					videoCanvasContext.fillText(`Date ${entries[c].date}`, 10, 150);
				}
				//additional delay to allow canvas drawing actions to settle
				//discovered via testing that this improves frame drawing time consistency greatly
				//NOTE: further testing revealed that this breaks rendering in some cases, not sure exactly why. commented out for now
				//await delay(50);
				mediaRecorder.resume();
				const startTime = Date.now();
				(canvasStream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack).requestFrame();
				await delay(frameDurationMs);
				(canvasStream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack).requestFrame();
				const endTime = Date.now();
				mediaRecorder.pause();
				console.log(`done drawing frame, time to draw = ${endTime - startTime}`);
				setStatusMessages( cs => [...cs, `generated frame: ${c}/${max-1}, actual frame duration = ${endTime - startTime} ms`]);
				setEntriesProcessed(c);
			}
		}
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


	 return (
    <div>
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
			<p>Estimated video duration: { frameDuration && entries ? `${(frameDuration*entries.length/1000)} seconds` : 'N/A'}</p>
			<button
				type="button"
				onClick={handleExportVideo}
			>
				Export Video
			</button>
			<label>Progress
				<progress max={entries?.length} value={entriesProcessed}>
					{entriesProcessed} entries processed out of {entries?.length}
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
		</div>
  );
}

export default Export;
