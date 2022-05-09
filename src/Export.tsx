import React, { useState, useRef, useEffect, Dispatch, SetStateAction, ChangeEvent } from 'react';
import  * as mathjs  from 'mathjs';
import * as PIXI from 'pixi.js';

//importi './Viewer.css';
import { db, Entry, Setting } from './db';
import { GlobalState } from './App';

type ExportAttributes = {
	globalState: GlobalState;
	setGlobalState: Dispatch<SetStateAction<GlobalState>>;
}
//import './Export.css';

const MIN_FRAME_DURATION_MS = 50;
const MAX_FRAME_DURATION_MS = 5000;

function Export({
	globalState,
	setGlobalState
}: ExportAttributes) { 
	let [statusMessages, setStatusMessages] = useState<string[]>([]);
	let [frameDuration, setFrameDuration] = useState<number>(150);

	const initializedRef = useRef<boolean>(false);
	const videoElementRef = useRef<HTMLVideoElement|null>(null);
	const videoSourceElementRef = useRef<HTMLSourceElement|null>(null);
	const frameDurationInputRef = useRef<HTMLInputElement|null>(null);

	useEffect( () => {
		if(initializedRef.current) {
			return;
		}
		console.log('intialize settings from DB started');
		initializedRef.current = true;
		Promise.all([
			db.settings.get('exportFrameDuration')
		]).then( ([
			_exportFrameDurationSetting
		]) => {
			console.log('intialize settings from DB finished');
			if(_exportFrameDurationSetting) {
				console.log(`set frameDuration to ${_exportFrameDurationSetting.value}`);
				setFrameDuration(_exportFrameDurationSetting.value);
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

	const handleExportVideo = async () => {
		console.log('handleExportVideo() called');
		setStatusMessages(["begin generating video for export"]);
		//let entries = await db.entries.orderBy('date').reverse().toArray();
		let entries = await db.entries.orderBy('date').toArray();
		setStatusMessages( cs => [...cs, "loaded entries from db"]);
		console.log('entries = ');
		console.dir(entries);
		//setup constants
		//const frameDurationMillis = 75;
		//const frameDuration = frameDurationMillis;//*1000;
		//const frameDuration = 5000*1000;
		
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
	 	setStatusMessages( cs => [...cs, `frameDurationMs = ${frameDurationMs}`]);
		//generate images from blobs
		let imagePromisesArray = entries.map( (entry) => {
			if(entry.alignedImageBlob) {
				return loadImageFromBlob(entry.alignedImageBlob);
			}
		});
		
		//setup media objects
		if(!(entries[0] && entries[0].alignedImageBlob)) {
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
				videoElementRef.current.src = URL.createObjectURL(recordedBlob);
			}
		});
		
		const delay = (ms:number) => new Promise( (resolve) => setTimeout(resolve, ms) );

		const doRecording = async () => {
			const rawAlignedImages:any[] = await Promise.all(imagePromisesArray)
			//const alignedImages = rawAlignedImages.slice(0);
			//const alignedImages = [rawAlignedImages[0], ...rawAlignedImages, rawAlignedImages[rawAlignedImages.length-1]];
			const alignedImages = [...rawAlignedImages, rawAlignedImages[rawAlignedImages.length-1]];
			//scale images and contrain to 720p dimensions
			//portrait or square
			const imageRatio = rawAlignedImages[0].naturalHeight/1280;
			let scaledImageWidth = rawAlignedImages[0].naturalWidth/imageRatio;
			console.log(`scaledImageWidth = ${rawAlignedImages[0].naturalWidth}/${imageRatio}`);
			let scaledImageHeight = 1280;
			if(rawAlignedImages[0].naturalWidth > rawAlignedImages[0].naturalHeight) {
				//landscape
				const imageRatio = rawAlignedImages[0].naturalWidth/1280;
				scaledImageWidth = 1280;
				scaledImageHeight = rawAlignedImages[0].naturalHeight/imageRatio;
			}
			console.log(`videoCanvas.width = ${scaledImageWidth} videoCanvas.height = ${scaledImageHeight}`);
			videoCanvas.width = scaledImageWidth;
			videoCanvas.height = scaledImageHeight;
			
			let scaledImageCanvases:HTMLCanvasElement[] = alignedImages.map( (image) => {
				const scaledCanvas = document.createElement('canvas');
				scaledCanvas.width = scaledImageWidth;
				scaledCanvas.height = scaledImageHeight;
				const scaledCanvasContext = scaledCanvas.getContext('2d');
				if(scaledCanvasContext) {
					scaledCanvasContext.drawImage(
						image, 
						0, 
						0, 
						rawAlignedImages[0].naturalWidth, 
						rawAlignedImages[0].naturalHeight, 
						0, 
						0, 
						scaledImageWidth, 
						scaledImageHeight
					);
				}
				return scaledCanvas;
			});

			const videoCanvasContext = videoCanvas.getContext('2d');
			if(videoCanvasContext) {
				videoCanvasContext.fillStyle = 'red';
				videoCanvasContext.font = '42px serif';
				//await delay();
				setStatusMessages( cs => [...cs, `start draw loop`]);
				setStatusMessages( cs => [...cs, `started mediaRecorder state = ${mediaRecorder.state}`]);
				//draw initial filler frame
				videoCanvasContext.fillRect(0, 0, scaledImageWidth, scaledImageHeight);
				(canvasStream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack).requestFrame();
				await delay(frameDurationMs);
				videoCanvasContext.fillRect(0, 0, scaledImageWidth, scaledImageHeight);
				(canvasStream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack).requestFrame();
				await delay(frameDurationMs);
				mediaRecorder.start();
				let prevTime = Date.now();
				for(let c = 0, max = scaledImageCanvases.length; c < max; c++) {
					const now = Date.now();
					setStatusMessages( cs => [...cs, `generating frame: ${c}`]);
					console.log(`renderFrame() time = ${now-prevTime}`);
					console.log(`start draw frame = ${c}`);
					videoCanvasContext.clearRect( 0, 0, scaledImageWidth, scaledImageHeight);
					videoCanvasContext.drawImage(scaledImageCanvases[c], 0, 0);
					(canvasStream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack).requestFrame();
					//videoCanvasContext.fillText(`FRAME: ${c}`, 10, 50);
					//videoCanvasContext.fillText(`TIME: ${now}`, 10, 100);
					//videoCanvasContext.fillText(`DELTA: ${now-prevTime}`, 10, 150);
					//mediaRecorder.requestData();
					await delay(frameDurationMs);
					//(canvasStream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack).requestFrame();
					console.log(`TIME: ${now} DELTA: ${now-prevTime}`);
					prevTime = now;
				}		
			}
			await delay(250);
			mediaRecorder.stop();
		}
		doRecording();
	};

	let debounceInputTimeout = useRef(0);
	const handleInputChange = async (event:ChangeEvent<HTMLInputElement>) => {
		console.group('handleInputChange() called');
		if(
			event.target
			&& event.target instanceof HTMLInputElement
			&& event.target.dataset.settingsKeyToModify
		) {
			let settingsKeyToModify = event.target.dataset.settingsKeyToModify;
			let newValue = parseInt(event.target.value as string);
			console.log('settingsKeyToModify = ', settingsKeyToModify);
			console.log('value = ', newValue);
			if(event.target.dataset.settingsKeyToModify === 'exportFrameDuration') {
				setFrameDuration(newValue);
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
			<button
				type="button"
				onClick={handleExportVideo}
			>
				Export Video
			</button>
			<input
				ref={frameDurationInputRef}
				type="number"
				value={frameDuration}
				onChange={handleInputChange}
				data-settings-key-to-modify="exportFrameDuration" 
				max={MAX_FRAME_DURATION_MS}
				min={MIN_FRAME_DURATION_MS}
			/>
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
			<video ref={videoElementRef} controls width="350">
			</video>
		</div>
  );
}

export default Export;
