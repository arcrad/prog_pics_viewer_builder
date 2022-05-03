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

	const handleExportVideo = async () => {
		console.log('handleExportVideo() called');
		setStatusMessages(["begin generating video for export"]);
//		db.entries.geti
		let entries = await db.entries.orderBy('date').reverse().toArray()
		setStatusMessages( cs => [...cs, "loaded entries from db"]);
		console.log('entries = ');
		console.dir(entries);
		const frameDuration = 1000;
		const videoFramesArray = entries.map( (entry, index) => {
			if(entry.alignedImageBlob) {
				setStatusMessages( cs => [...cs, `generating frame: ${index}`]);
				const newFrame = new window.VideoFrame(
					entry.alignedImageBlob,
					{
						duration: frameDuration,
						timestamp: frameDuration*index
					}
				);
				console.dir(newFrame);
				return newFrame;
			}
		});
		setStatusMessages( cs => [...cs, "finished generating frames"]);
		console.log('frames = ');
		console.dir(videoFramesArray);
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
		</div>
  );
}

export default Export;
