import React, { useState, useEffect, useRef, Dispatch, SetStateAction, ChangeEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';

import { db, Entry } from './db';
import { GlobalState } from './App';

type EntryAttributes = {
	globalState: GlobalState,
	setGlobalState: Dispatch<SetStateAction<GlobalState>>
};

function EntryComponent({
	globalState, 
	setGlobalState
} : EntryAttributes ) {

	let [currentEntryWeight, setCurrentEntryWeight] = useState("123");
	let [currentEntryDate, setCurrentEntryDate] = useState("april 5, 2022");
	
let storeImageRef = useRef<HTMLButtonElement>(null);
	let imageUploadRef = useRef<HTMLInputElement>(null);
  let entrySelectRef = useRef<HTMLSelectElement>(null);

	const entries = useLiveQuery(
		() => db.entries.toArray()
	);

	const currentEntry = useLiveQuery(
		() => db.entries.get(globalState.currentEntryId)
	, [globalState]);

	useEffect( () => {
		setCurrentEntryWeight( c => currentEntry?.weight ? String(currentEntry.weight) : '');
		setCurrentEntryDate( c => currentEntry?.date ? currentEntry.date : '');
	}, [currentEntry]);
	useEffect( () => {
		let handleEntrySelectChange = (event:Event) => {
			//console.dir(event);
			let newEntryId = parseInt( (event.target as HTMLSelectElement).value );
			//console.log('value=', newEntryId);
			setGlobalState( (cs):GlobalState => {
				let ns = { currentEntryId: newEntryId };
				return { ...cs, ...ns }; 
			});
		};
		entrySelectRef.current?.addEventListener('change', handleEntrySelectChange);
		return (
			() => entrySelectRef.current?.removeEventListener('change', handleEntrySelectChange)
		);
	}, []);

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
				let newState = { currentEntryId: parseInt(event.target.dataset.entryId)};
				setGlobalState( (prevState):GlobalState => { return {...prevState, ...newState}});
				console.log(`Successfully deleted ${numberDeleted} records.`);
			} catch(error) {
				console.error(`encountered error trying to delete record with id = ${event.target.dataset.entryId}`);
			}
		}
	};

	const handleMarkEntry = async (event:React.MouseEvent<HTMLButtonElement>) => {
		console.log('handleMarkEntry');
	};
	
	const handleChangeImageEntry = async (event:React.MouseEvent<HTMLButtonElement>) => {
		console.log('handleChangeImageEntry');
	};

	let debounceInputTimeout = useRef(0);
	const handleEntryInputChange = async (event:React.ChangeEvent<HTMLInputElement>) => {
		console.log('handleEntryInputChange');
		if(
			event.target
			&& event.target instanceof HTMLInputElement
			&& event.target.dataset.entryId
			&& event.target.dataset.entryKeyToModify
		) {
			let entryIdToModify = parseInt(event.target.dataset.entryId);
			console.log('entryId = ', entryIdToModify);
			console.log('entryKeyToModify = ', event.target.dataset.entryKeyToModify);
			console.log('value = ', event.target.value);
			if(event.target.dataset.entryKeyToModify === 'weight') {
				setCurrentEntryWeight(event.target.value);
			} else {
				setCurrentEntryDate(event.target.value);
			}
			clearTimeout(debounceInputTimeout.current);
			let modifyDbValueHandler = () => {
					console.log('fire update db with new input');
					if(event.target.dataset.entryKeyToModify) {
					db.entries.update(entryIdToModify, {
						[event.target.dataset.entryKeyToModify]: event.target.value
					});
					}
			};

			debounceInputTimeout.current = window.setTimeout( modifyDbValueHandler, 300);
		}
	};

	return (
    <div>
			<input ref={imageUploadRef} type="file" id="image_upload" name="image_upload"></input>
			<button ref={storeImageRef} type="button" id="store_image">Store Image</button>
			<div>
				<h1>Entries ( id = {globalState.currentEntryId} )</h1>
				<select ref={entrySelectRef} value={globalState.currentEntryId}>
				{
					entries?.map( entry =>
						<option value={entry.id} key={entry.id}>{entry.id}: {entry.date}</option>
					)
				}
				</select>
				<hr/>
							<div>
								<input 
									type="text" 
									value={currentEntryWeight} 
									data-entry-id={currentEntry?.id} 
									data-entry-key-to-modify="weight" 
									onChange={handleEntryInputChange}
								/> @ 
								<input 
									type="text" 
									value={currentEntryDate}
									data-entry-id={currentEntry?.id} 
									data-entry-key-to-modify="date"
									onChange={handleEntryInputChange}
								/>
							</div>
							<img src={currentEntry?.image} style={{maxWidth: '30rem'}}/>
							<div>
								<button 
									type="button" 
									data-entry-id={currentEntry?.id} 
									onClick={handleMarkEntry}
								>
									Mark
								</button>
								<button 
									type="button" 
									data-entry-id={currentEntry?.id} 
									onClick={handleChangeImageEntry}
								>
									Change Image
								</button>
								<button 
									type="button" 
									data-entry-id={currentEntry?.id} 
									onClick={handleDeleteEntry}
								>
									Delete
								</button>
							</div>
				<hr/>
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
