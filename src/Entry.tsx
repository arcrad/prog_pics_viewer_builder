import React, { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Entry } from './db';

type EntryAttributes = {
	currentEntryId: number,
	setCurrentEntryId: Dispatch<SetStateAction<number>>
};

function EntryComponent( {
	currentEntryId, 
	setCurrentEntryId
}:EntryAttributes ) {
	let storeImageRef = useRef<HTMLButtonElement>(null);
	let imageUploadRef = useRef<HTMLInputElement>(null);
  
	const entries = useLiveQuery(
		() => db.entries.toArray()
	);

	useEffect( () => {
		const addDbEntry = async (imageData:string) => {
			console.log("adding db entry...");
			try {
				const date = (new Date()).toLocaleString();
				const weight = parseFloat((Math.random()*200).toFixed(2));
				const image = imageData;
				const id = await db.entries.add({
					date,
					weight,
					image
				});
			} catch(error) {
				console.error(`failed to add db entry. ${error}`);
			}
		};

		const storeImageHandler = () => {
			//console.dir(imageUploadRef.current);
			console.log("handle store image...");
			let selectedFile;
			if(imageUploadRef.current && imageUploadRef.current.files) {
				selectedFile = imageUploadRef.current.files[0];
			}
			const reader = new FileReader();
			reader.onload = (event) => {
				if(event.target && event.target.result) {
					console.log("result=", event.target.result);
					if(typeof event.target.result === "string") {
						addDbEntry(event.target.result);
						//let newImage = document.createElement("img");
						/*let newImage = new Image();
						newImage.src = event.target.result;
						document.body.append(newImage);*/
					}
				}
			};
			if(selectedFile) {
				//reader.readAsText(selectedFile);
				reader.readAsDataURL(selectedFile);
			}
		};

		if(storeImageRef.current) {
			storeImageRef.current.addEventListener("click", storeImageHandler);
		}

		return () => {
			if(storeImageRef.current) {
				storeImageRef.current.removeEventListener("click", storeImageHandler);
			}
		}
	}, []);

	const handleDeleteEntry = async (event:React.MouseEvent<HTMLButtonElement>) => {
		console.log("handle delete entry...");
		//console.dir(event);
		if(event.target && event.target instanceof HTMLButtonElement && event.target.dataset.entryId) {
			console.log(`entryId to delete = ${event.target.dataset.entryId}`);
			try {
				const numberDeleted = await db.entries
					.where("id").anyOf(parseInt(event.target.dataset.entryId))
					.delete();
				console.log(`Successfully deleted ${numberDeleted} records.`);
			} catch(error) {
				console.error(`encountered error trying to delete record with id = ${event.target.dataset.entryId}`);
			}
		}
	}

	return (
    <div>
			<input ref={imageUploadRef} type="file" id="image_upload" name="image_upload"></input>
			<button ref={storeImageRef} type="button" id="store_image">Store Image</button>
			<div>
				<h1>Entries ( id = {currentEntryId} )</h1>
				{ 
					entries?.map( entry => 
						<div key={entry.id} style={{border: '1px solid black', padding: '1rem', margin: '1rem'}}>
							<p>{entry.weight} @ {entry.date}</p>
							<img src={entry.image} style={{maxWidth: '30rem'}}/>
							<button type="button" data-entry-id={entry.id} onClick={handleDeleteEntry}>Delete</button>
						</div> )
				}
			</div>
    </div>
  );
}

export default EntryComponent;
