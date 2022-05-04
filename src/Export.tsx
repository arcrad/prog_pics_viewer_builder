import React, { useState, useRef, useEffect, Dispatch, SetStateAction } from 'react';
import  * as mathjs  from 'mathjs';
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

	function loadImageFromBlob(blob:Blob) {
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
		let entries = await db.entries.orderBy('date').reverse().toArray()
		setStatusMessages( cs => [...cs, "loaded entries from db"]);
		console.log('entries = ');
		console.dir(entries);
		//setup constants
		const frameDuration = 5000000;
		//generate images from blobs
		let imagePromisesArray = entries.map( (entry) => {
			if(entry.alignedImageBlob) {
				return loadImageFromBlob(entry.alignedImageBlob);
			}
		});
		Promise.all(imagePromisesArray).then( (alignedImages) => {
			const videoFramesArray = alignedImages.map( (image, index) => {
				//if(image) {
					setStatusMessages( cs => [...cs, `generating frame: ${index}`]);
					const newFrame = new window.VideoFrame(
						image,
						{
							duration: frameDuration,
							timestamp: frameDuration*index
						}
					);
					console.dir(newFrame);
					return newFrame;
				//}
			});
			setStatusMessages( cs => [...cs, "finished generating frames"]);
			console.log('frames = ');
			console.dir(videoFramesArray);
			const trackGenerator = new window.MediaStreamTrackGenerator({kind: 'video'});	
			const trackWriter = trackGenerator.writable.getWriter();


	 				setStatusMessages( cs => [...cs, 'create MediaStream']);
					const mediaStream = new window.MediaStream([trackGenerator]);
					console.log('mediaStream = ');
					console.dir(mediaStream);
					if(videoElementRef.current) {
						setStatusMessages( cs => [...cs, 'set video to mediaStream']);
						videoElementRef.current.srcObject = mediaStream;
					}

			setStatusMessages( cs => [...cs, "created window.MediaStreamTrackGenerator and trackWriter"]);
		//	(new Promise( (resolve, reject) => {
			videoFramesArray.forEach ( (frame, index) => {
				trackWriter.ready
					.then( () => {
						return trackWriter.write(frame);
					})
					.then( () => {
						//frame written
						setStatusMessages( cs => [...cs, `wrote frame ${index} to trackWriter`]);
	/*					if(index == videoFramesArray.length - 1) {
							setStatusMessages( cs => [...cs, `wrote final frame to trackWriter`]);
							resolve(1);
						}*/
					});
			});
		//	})).then( () => {
			trackWriter.ready
				.then( () => {
				//	trackWriter.close();
				})
				.then( () => {
					setStatusMessages( cs => [...cs, `all frames written. closed trackWriter`]);
					console.log('trackGenerator = ');
					console.dir(trackGenerator);
				})
				.then( () => {
					
/*	
	 				setStatusMessages( cs => [...cs, 'create MediaStream']);
					trackGenerator.enabled = true;
					//const mediaStream = new window.MediaStream([trackGenerator]);
					const mediaStream = new window.MediaStream();
					console.log('mediaStream = ');
					console.dir(mediaStream);
					if(videoElementRef.current) {
						setStatusMessages( cs => [...cs, 'set video to mediaStream']);
						videoElementRef.current.srcObject = mediaStream;
					}
					//mediaStream.addTrack(trackGenerator);
					console.log('mediaStream.getVideoTracks() = ');
					console.dir(mediaStream.getVideoTracks());
	*/				
				});
	//	});
		});
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
			<p>Status:</p>
			<ul>
			{
				statusMessages?.map( (message) => {
					return <li key={message}>{message}</li>
				})
			}
			</ul>
			<hr/>
			<h2>Output Video</h2>
			<video ref={videoElementRef} controls width="350">
			</video>
		</div>
  );
}

export default Export;
