import React, { useState, useRef, useEffect, Dispatch, SetStateAction } from 'react';
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

function Export({
	globalState,
	setGlobalState
}: ExportAttributes) { 
	let [statusMessages, setStatusMessages] = useState<string[]>([]);

	const videoElementRef = useRef<HTMLVideoElement|null>(null);
	const videoSourceElementRef = useRef<HTMLSourceElement|null>(null);
	const frameDurationInputRef = useRef<HTMLInputElement|null>(null);

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
				frameDurationMs = frameDurationInputRefValue < 5 ? 5 : frameDurationInputRefValue > 2500 ? 2500 : frameDurationInputRefValue;
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
		let firstImage:HTMLImageElement = await loadImageFromBlob(entries[0].alignedImageBlob);
		const PIXIApp = new PIXI.Application({width: firstImage.naturalWidth, height: firstImage.naturalHeight});
		const trackGenerator = new window.MediaStreamTrackGenerator({kind: 'video'});	
		const trackWriter = trackGenerator.writable.getWriter();
		setStatusMessages( cs => [...cs, "created MediaStreamTrackGenerator and trackWriter"]);
		//const mediaStream = new window.MediaStream([trackGenerator]);
		const videoCanvas = document.createElement('canvas');
	 	setStatusMessages( cs => [...cs, 'created MediaStream']);
		const canvasStream = videoCanvas.captureStream(60);
		//const mediaRecorder = new window.MediaRecorder(canvasStream, {
		const mediaRecorder = new window.MediaRecorder(PIXIApp.view.captureStream(120), {
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
		
		const subFrames = 25;

		const delay = (ms:number) => new Promise( (resolve) => setTimeout(resolve, ms) );
		

		//trackWriter.ready.then( async () => {
			//mediaRecorder.onstart = async () => {
		const doRecording = async () => {
			//await delay(500);
			const rawAlignedImages:any[] = await Promise.all(imagePromisesArray)
			const alignedImages = rawAlignedImages.slice(0);
			//const alignedImages = [rawAlignedImages[0], ...rawAlignedImages, rawAlignedImages[rawAlignedImages.length-1]];
			const imageSprites:any[] = alignedImages.map( (image) => {
				setStatusMessages( cs => [...cs, `generated sprite from image`]);
				return PIXI.Sprite.from(image);
			});
			//const alignedImages = [...rawAlignedImages, rawAlignedImages[rawAlignedImages.length-1]];
			const canvasWidth = rawAlignedImages[0].naturalWidth;
			const canvasHeight = rawAlignedImages[0].naturalHeight;
			videoCanvas.width = canvasWidth;
			videoCanvas.height = canvasHeight;
			
			//PIXIApp.width = canvasWidth;
			//PIXIApp.height = canvasHeight;
			imageSprites.forEach( (sprite) => {
				//sprite.x = -canvasWidth;
				//sprite.y = -canvasHeight;
				sprite.visible = false;
				PIXIApp.stage.addChild(sprite);
				console.dir(sprite);
			});
				
			const videoCanvasContext = videoCanvas.getContext('2d');
			if(videoCanvasContext) {
				videoCanvasContext.fillStyle = 'red';
				videoCanvasContext.font = '42px serif';
				//videoCanvasContext.drawImage(rawAlignedImages[0], 0, 0, canvasWidth, canvasHeight);
				//await delay();
				setStatusMessages( cs => [...cs, `start draw loop`]);
				mediaRecorder.start();
				//PIXIApp.ticker.stop();
			setStatusMessages( cs => [...cs, `started mediaRecorder state = ${mediaRecorder.state}`]);
				let prevTime = window.performance.now();
				//for(let c = 0, max = alignedImages.length; c < max; c++) {
				for(let c = 0, max = imageSprites.length; c < max; c++) {
						const now = window.performance.now();
					//	setStatusMessages( cs => [...cs, `generating frame: ${c}`]);
						setStatusMessages( cs => [...cs, `start draw frame = ${c}`]);
						console.log(`start draw frame = ${c}`);
						//videoCanvasContext.cleiarRect( 0, 0, canvasWidth, canvasHeight);
						//videoCanvasContext.drawImage(alignedImages[c], 0, 0, canvasWidth, canvasHeight);
						//if( c > 0) {
						//imageSprites[c-1].x = -canvasWidth;
						//imageSprites[c-1].y = -canvasHeight;
						//}
						//imageSprites[c].x = 0;
						//imageSprites[c].y = 0;
						imageSprites[c].visible = true;
					//PIXIApp.ticker.update();
						mediaRecorder.requestData();
						//(canvasStream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack).requestFrame();
						//mediaRecorder.requestData();
						await delay(frameDurationMs);
						console.log(`TIME: ${now} DELTA: ${now-prevTime}`);
						//videoCanvasContext.clearRect( 0, 0, canvasWidth, canvasHeight);
						//videoCanvasContext.fillText(`TIME: ${now}`, 10, 50);
						//videoCanvasContext.fillText(`DELTA: ${now-prevTime}`, 10, 100);
					//(canvasStream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack).requestFrame();
					//	mediaRecorder.requestData();
						
						//(canvasStream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack).requestFrame();
						//setStatusMessages( cs => [...cs, `end draw frame = ${c}`]);
						prevTime = now;
				/*		(canvasStream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack).requestFrame();
						await delay(frameDurationMillis);
						videoCanvasContext.clearRect( 0, 0, canvasWidth, canvasHeight);
						await delay(frameDurationMillis);
						await delay(frameDurationMillis+500);
						(canvasStream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack).requestFrame();*/
				}
			}
						mediaRecorder.requestData();
						await delay(250);
			mediaRecorder.stop();
			PIXIApp.destroy();
		}
		doRecording();
			/*const alignedImages = [rawAlignedImages[0], ...rawAlignedImages, rawAlignedImages[rawAlignedImages.length-1]];
			for(let c = 0, max = alignedImages.length; c < max; c++) {
				//alignedImages.forEach( (image, c) => {
					//const max = alignedImages.length-1;
					console.log(`c = ${c}, max = ${max}`);
					//for( let i = 1; i < subFrames; i++) {
					const baseFrame = new window.VideoFrame(
						alignedImages[c],
						{
							duration: 0//frameDuration,
							//timestamp: frameDuration*index
						}
					);
						//	trackWriter.write(baseFrame);
					//		setStatusMessages( cs => [...cs, `wrote frame ${c} to trackWriter`]);
				//			mediaRecorder.requestData();
						//await delay(frameDurationMillis+5050);
					//Array.from({length: subFrames}, (x, i) => i+1).forEach( (i) => {
					for(let i = 1; i < subFrames; i++) {
					setStatusMessages( cs => [...cs, `generating frame: ${(c*subFrames)+i}`]);
						const newFrame = baseFrame.clone();
							trackWriter.write(newFrame);
							newFrame.close();
							setStatusMessages( cs => [...cs, `wrote frame ${(c*subFrames)+i} to trackWriter`]);
							mediaRecorder.requestData();
						await delay(frameDurationMillis);
						console.log(`delay = ${10000+(frameDurationMillis*((c*subFrames)+i))}`);
					};
					baseFrame.close();
				}
						await delay(frameDurationMillis);
									trackWriter.close();
/*
				initialPromise = initialPromise.then( () => {
									setStatusMessages( cs => [...cs, `wrote final frame to trackWriter. closing trackWriter`]);
									trackWriter.close();
									setStatusMessages( cs => [...cs, `mediaRecorder state = ${mediaRecorder.state}`]);
				});
*/
				//setStatusMessages( cs => [...cs, "finished generating frames"]);
				//console.log('frames = ');
				//console.dir(videoFramesArray);
				//};
			//});
	};

	 return (
    <div>
    	<h2>Export</h2>
			<button
				type="button"
				onClick={handleExportVideo}
			>
				Export Video
			</button>
			<input
				ref={frameDurationInputRef}
				type="number"
				max="2000"
				min="100"
			/>
			<p>Status:</p>
			<ul>
			{
				statusMessages?.map( (message, index) => {
					return <li key={index}>{message}</li>
				})
			}
			</ul>
			<hr/>
			<h2>Output Video</h2>
			<video ref={videoElementRef} controls autoPlay width="350">
			</video>
		</div>
  );
}

export default Export;
