import 
	React, 
	{ 
		useState, 
		useEffect, 
		useRef, 
		Dispatch, 
		SetStateAction, 
		MouseEvent,
		ChangeEvent 
	} from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
	BrowserRouter, 
	Routes, 
	Route, 
	NavLink, 
	useNavigate 
} from 'react-router-dom';

import { db, Entry } from './db';
import { GlobalState } from './App';
import ChangeImageModal from './ChangeImageModal';
import MarkImageModal from './MarkImageModal';
import AddEntryModal from './AddEntryModal';
import { getEntryValidationErrorsComponent } from './Common';
 
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
	let [changeImageModalIsVisible, setChangeImageModalIsVisible] = useState(false);
	let [markImageModalIsVisible, setMarkImageModalIsVisible] = useState(false);
	let [addEntryModalIsVisible, setAddEntryModalIsVisible] = useState(false);
	let [entryIdBeingEdited, setEntryIdBeingEdited] = useState(-1);
	let [pagerOffset, setPagerOffset] = useState(0);
	let [entryThumbnailImageUrls, setEntryThumbnailImageUrls] = useState<{[key:number]:string}>();
	
	let addEntryRef = useRef<HTMLButtonElement>(null);
	let imageUploadRef = useRef<HTMLInputElement>(null);
  let entrySelectRef = useRef<HTMLSelectElement>(null);

	const navigate = useNavigate();

	const pagerLimit = 10;

	const totalEntriesCount = useLiveQuery(
		() => db.entries.filter((entry) => globalState.settings.showDraftsInEntries || entry.draft !== true).count()
	);
	const entries = useLiveQuery(
		() => db.entries.orderBy('date').filter((entry) => globalState.settings.showDraftsInEntries || entry.draft !== true).reverse().offset(pagerOffset).limit(pagerLimit).toArray()
	, [
		pagerOffset, 
		pagerLimit
	]);

	useEffect( () => {
		//remove old urls 
		setEntryThumbnailImageUrls( (cs) => {
			if(cs) {
				Object.keys(cs).forEach( (key) => {
					console.log(`revokeObjectUrl(${cs[parseInt(key)]})`);
					URL.revokeObjectURL(cs[parseInt(key)]);
				});
			}
			return {};
		});
		//generate new urls 
		if(entries) {
			const entryThumbnailUrls = entries.reduce( (accumulator, currentEntry) => {
				if(currentEntry.thumbImageBlob) {
					let newData = {[currentEntry.id as number]: URL.createObjectURL(currentEntry.thumbImageBlob)};
					return { ...accumulator, ...newData};
				}
				return accumulator;
			}, {});
			console.dir(entryThumbnailUrls);
			setEntryThumbnailImageUrls(entryThumbnailUrls);
		}
	}, [entries]);

/*
	const currentEntry = useLiveQuery(
		() => db.entries.get(globalState.currentEntryId)
	, [globalState]);

	useEffect( () => {
		setCurrentEntryWeight( c => currentEntry?.weight ? String(currentEntry.weight) : '');
		setCurrentEntryDate( c => currentEntry?.date ? currentEntry.date : '');
	}, [currentEntry]);
	*/

/*
	let handleEntrySelectChange = (event:ChangeEvent<HTMLSelectElement>) => {
		//console.dir(event);
		let newEntryId = parseInt( (event.target as HTMLSelectElement).value );
		//console.log('value=', newEntryId);
		setGlobalState( (cs):GlobalState => {
			let ns = { currentEntryId: newEntryId };
			return { ...cs, ...ns }; 
		});
	};
	*/

	/*useEffect( () => {
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
	}, []);*/

	const addDbEntry = async (imageData:string) => {
		console.log("adding db entry...");
	};

	const handleAddEntry = async (event:MouseEvent<HTMLButtonElement>) => {
		//console.dir(imageUploadRef.current);
		console.log("handle add entry..");
		//setAddEntryModalIsVisible(true);
	//	navigate(`./add/${globalState.currentEntryId}/image`);
	/////	return; 
 		try {
			const date = ((new Date()).toISOString()).substring(0, 16); 
			//datetime needs to be more robust
			const id = await db.entries.add({
				date: date,
				draft: true
			});
			console.log( 'new id =', id);
			/*setGlobalState( (cs):GlobalState => {
				console.log('inner id=',id);
				let ns = { currentEntryId: id as number};
				return { ...cs, ...ns };
			});*/
			setAddEntryModalIsVisible(true);
			navigate(`./add/${id}/image`);
		} catch(error) {
			console.error(`failed to add db entry. ${error}`);
		}
	};
/*
	useEffect( () => {
		const addDbEntry = async (imageData:string) => {
			console.log("adding db entry...");
			try {
				const date = ((new Date()).toISOString()).substring(0, 16); //datetime needs to be more robust
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

		const addEntryHandler = () => {
			//console.dir(imageUploadRef.current);
			console.log("handle add entry..");
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
					}
				}
			};
			if(selectedFile) {
				//reader.readAsText(selectedFile);
				reader.readAsDataURL(selectedFile);
			}
		};

		if(addEntryRef.current) {
			addEntryRef.current.addEventListener("click", storeImageHandler);
		}

		return () => {
			if(addEntryRef.current) {
				addEntryRef.current.removeEventListener("click", storeImageHandler);
			}
		}
	}, []);*/

	const handleDeleteEntry = async (event:MouseEvent<HTMLButtonElement>) => {
		console.log("handle delete entry...");
		//console.dir(event);
		if(event.target && event.target instanceof HTMLButtonElement && event.target.dataset.entryId) {
			console.log(`entryId to delete = ${event.target.dataset.entryId}`);
			try {
				const numberDeleted = await db.entries
					.where("id").anyOf(parseInt(event.target.dataset.entryId))
					.delete();
				//let newState = { currentEntryId: parseInt(event.target.dataset.entryId)};
			/*	db.entries.orderBy('date').reverse().toArray().then( (newEntries) => {
					if(newEntries && newEntries[0] && newEntries[0].id) {
						let newState = { currentEntryId: newEntries[0].id};
						setGlobalState( (prevState):GlobalState => { return {...prevState, ...newState}});
					}
				});*/
				console.log(`Successfully deleted ${numberDeleted} records.`);
			} catch(error) {
				console.error(`encountered error trying to delete record with id = ${event.target.dataset.entryId}`);
			}
		}
	};

	const handleDuplicateEntry = async (event:MouseEvent<HTMLButtonElement>) => {
		//console.dir(imageUploadRef.current);
		console.log("handle duplicate entry..");
		if(event.target && event.target instanceof HTMLButtonElement && event.target.dataset.entryId) {
			console.log(`entryId to duplicate = ${event.target.dataset.entryId}`);
			const date = ((new Date()).toISOString()).substring(0, 16);
			let entryToDuplicate = await db.entries.get(parseInt(event.target.dataset.entryId as string));
			//datetime needs to be more robust
			if(entryToDuplicate) {
				try {
					const id = await db.entries.add({
						date: date,//entryToDuplicate.date,
						draft: entryToDuplicate.draft,
						weight: entryToDuplicate.weight,
						notes: entryToDuplicate.notes,
						imageBlob: entryToDuplicate.imageBlob,
						imageNaturalWidth: entryToDuplicate.imageNaturalWidth,
						imageNaturalHeight: entryToDuplicate.imageNaturalHeight,
						thumbImageBlob: entryToDuplicate.thumbImageBlob,
						marks: entryToDuplicate.marks
					});
					console.log( 'new id =', id);
				/*	setGlobalState( (cs):GlobalState => {
						console.log('inner id=',id);
						let ns = { currentEntryId: id as number};
						return { ...cs, ...ns };
					});*/
				} catch(error) {
					console.error(`failed to duplicate db entry. ${error}`);
				}
			}
		}
	};

	const handleEditEntry = async (event:MouseEvent<HTMLButtonElement>) => {
		console.log('handleEditEntry');
		if(
			event.target
			&& event.target instanceof HTMLButtonElement
			&& event.target.dataset.entryId
		) {
			setEntryIdBeingEdited(parseInt(event.target.dataset.entryId));
		}
	};

	const handleMarkEntry = async (event:MouseEvent<HTMLButtonElement>) => {
		console.log('handleMarkEntry');
		if(
			event.target
			&& event.target instanceof HTMLButtonElement
			&& event.target.dataset.entryId
		) {
			/*setGlobalState( (cs):GlobalState =>{
				let eventTargetElement = event.target as HTMLButtonElement;
				if(eventTargetElement && eventTargetElement.dataset.entryId) {
					let newCurrentEntryId = parseInt(eventTargetElement.dataset.entryId);
					let ns = { currentEntryId: newCurrentEntryId };
					return { ...cs, ...ns};
				}
				return cs;
			});*/
			let entryId = parseInt(event.target.dataset.entryId);
			//setMarkImageModalIsVisible(true);
			navigate(`./mark/${entryId}`);
		}
	};
	
	const handleChangeImageEntry = async (event:MouseEvent<HTMLButtonElement>) => {
		console.log('handleChangeImageEntry');
		if(
			event.target
			&& event.target instanceof HTMLButtonElement
			&& event.target.dataset.entryId
		) {
			/*setGlobalState( (cs):GlobalState =>{
				let eventTargetElement = event.target as HTMLButtonElement;
				if(eventTargetElement && eventTargetElement.dataset.entryId) {
					let newCurrentEntryId = parseInt(eventTargetElement.dataset.entryId);
					let ns = { currentEntryId: newCurrentEntryId };
					return { ...cs, ...ns};
				}
				return cs;
			});*/
			let entryId = parseInt(event.target.dataset.entryId);
			//setChangeImageModalIsVisible(true);
			navigate(`./change_image/${entryId}`);
		}
	};

	let debounceInputTimeout = useRef(0);
	const handleEntryInputChange = async (event:ChangeEvent<HTMLInputElement>) => {
		console.log('handleEntryInputChange');
		if(
			event.target
			&& event.target instanceof HTMLInputElement
			&& event.target.dataset.entryId
			&& event.target.dataset.entryKeyToModify
		) {
			let entryIdToModify = parseInt(event.target.dataset.entryId);
			let entryKeyToModify = event.target.dataset.entryKeyToModify;
			let newValue = event.target.value;
			console.log('entryId = ', entryIdToModify);
			console.log('entryKeyToModify = ', entryKeyToModify);
			console.log('value = ', newValue);
			if(event.target.dataset.entryKeyToModify === 'weight') {
				setCurrentEntryWeight(event.target.value);
			} else {
				setCurrentEntryDate(event.target.value);
			}
			clearTimeout(debounceInputTimeout.current);
			let modifyDbValueHandler = () => {
					console.log('fire update db with new input', newValue, entryIdToModify);
					if(event.target.dataset.entryKeyToModify) {
					db.entries.update(entryIdToModify, {
						[entryKeyToModify]: newValue
					});
					}
			};

			debounceInputTimeout.current = window.setTimeout( modifyDbValueHandler, 500);
		}
	};

	//<input ref={imageUploadRef} type="file" id="image_upload" name="image_upload"></input>
	//generate blob urls 
/*	const entriesImageUrls = useRef<{[key: string]: string}>({});

async function verifyPermission(fileHandle: any, readWrite: boolean) {
  const options: {mode?: string} = {};
  if (readWrite) {
    options.mode = 'readwrite';
  }
  // Check if permission was already granted. If so, return true.
  if ((await fileHandle.queryPermission(options)) === 'granted') {
    return true;
  }
  // Request permission. If the user grants permission, return true.
  if ((await fileHandle.requestPermission(options)) === 'granted') {
    return true;
  }
  // The user didn't grant permission, so return false.
  return false;
}	
*/
	//useEffect( () => {
/*	const handleListRefresh = () => {
		console.log('update entriesImageUrls');
		if( entries ) {
			entries.forEach( async (entry) => {
				if( await verifyPermission(entry.imageFileHandle, false) ) {
					entriesImageUrls.current[String(entry.id)] = URL.createObjectURL( await entry.imageFileHandle.getFile());
				}
			});
	/*		Promise.all(fileHandlePermissionValidations).then( (results
			let getFileRequests = entries.map( (entry) => {
				return entry.imageFileHandle.getFile();
			});
			Promise.all(getFileRequests).then( (fileBlobs) => {
				entriesImageUrls.current = fileBlobs.reduce( (accumulator, fileBlob, index) => {
					return {...accumulator, ...{ [String(entries[index].id)]: URL.createObjectURL(fileBlob) } };
				}, {});
			});*/

//			console.dir(entriesImageUrls.current);
//		}
//	};
	//}, [entries]);
/*
	const getEntryValidationErrors = (entry: Entry) => {
		const entryHasAllMarks = entry.marks && Object.keys(entry.marks).length == 3; 
		const entryDoesntHaveWeight = entry.weight == null || String(entry.weight) == '';
		const entryDoesntHaveDate = entry.date == null;
		const entryDoesntHaveImageBlob = entry.imageBlob == null;
		const entryDoesntHaveAlignedImageBlob = entry.alignedImageBlob == null;

		if( 
			!entryHasAllMarks 
			|| entryDoesntHaveWeight 
			|| entryDoesntHaveDate
			|| entryDoesntHaveImageBlob
			|| entryDoesntHaveAlignedImageBlob
		) {
			return <div>
				⚠️  This entry has validation errors!
				<ul>
					{ entryDoesntHaveImageBlob ? <li>❌ Entry is is missing image</li> : ''}
					{ entryDoesntHaveWeight ? <li>❌ Entry is missing weight</li> : ''}
					{ entryHasAllMarks ? '' : <li>❌ Entry doesn't have all marks</li>}
					{ entryDoesntHaveDate ? <li>❌ Entry is missing date</li> : ''}
					{ entryDoesntHaveAlignedImageBlob ? <li>❌ Entry is missing an aligned image</li> : ''}
				</ul>
			</div>
		}
	}
*/
	return (
    <div className="columns is-centered">
			<div className="column is-10-tablet is-6-desktop">
				<h2>Entries</h2>
				<div className="control">
					<button 
						ref={addEntryRef} 
						type="button" 
						className="button is-primary" 
						onClick={handleAddEntry}>Add Entry</button>
				</div>
				<hr/>
				{/*<button type="button" onClick={handleListRefresh}> Refresh List</button>*/}
				<div className="field is-grouped is-grouped-centered">
				<div className="control">
				<button
					type="button"
					className="button is-info"
					onClick={() => {
						setPagerOffset(0)
					}}
				>
					First
				</button>
				</div>
				<div className="control">
				<button
					type="button"
					className="button is-info"
					onClick={() => {
						setPagerOffset( curOffset => {
							return curOffset - pagerLimit >= 0 ? curOffset - pagerLimit : 0
						})
					}}
				>
					Previous
				</button>
				</div>
				<span> {pagerOffset+1} - {pagerOffset+pagerLimit} of {totalEntriesCount} ({pagerOffset/pagerLimit}) </span>
				<div className="control">
				<button
					type="button"
					className="button is-info"
					onClick={() => {
						setPagerOffset( curOffset => {
							if(totalEntriesCount && curOffset < totalEntriesCount - pagerLimit) {
								return curOffset + pagerLimit < totalEntriesCount ? curOffset + pagerLimit : totalEntriesCount - pagerLimit
							}
							return curOffset;
						})
					}}
				>
					Next
				</button>
				</div>
				<div className="control">
				<button
					type="button"
					className="button is-info"
					onClick={() => {
						if(totalEntriesCount) {
							setPagerOffset(Math.floor((totalEntriesCount-1)/pagerLimit)*pagerLimit)
						}
					}}
				>
					Last
				</button>
				</div>
				</div>
				<ol 
					start={pagerOffset+1}
				>
				{
					entries?.map( entry =>
						<li key={entry.id} className="box">
							<div className="columns is-centered">
							<div className="column is-narrow">
							{ entryThumbnailImageUrls && entry.id && 
								<div style={{
									border: '0px solid #000',
									height: '7rem',
									width: '7rem',
									background: `url(${entryThumbnailImageUrls[entry.id]}) center / contain no-repeat #ded`,
								}}></div>
							}
							</div>
							<div className="column">
							{ ( entryIdBeingEdited === entry.id ) ? 
								<div className="field is-grouped is-grouped-centered">
									Weight: 
									<input 
										type="number" 
										className="input is-small"
										defaultValue={entry.weight} 
										data-entry-id={entry.id} 
										data-entry-key-to-modify="weight" 
										onChange={handleEntryInputChange}
									/>&nbsp;on&nbsp;
									<input 
										type="datetime-local" 
										className="input is-small"
										defaultValue={entry.date}
										data-entry-id={entry.id} 
										data-entry-key-to-modify="date"
										onChange={handleEntryInputChange}
									/>
									<button 
										type="button" 
										className="button is-light is-small"
										data-entry-id="-1" 
										onClick={handleEditEntry}
									>
										Close
									</button>
								</div>
								:
								<>
		 						<p>{(new Date(entry.date)).toLocaleString()} {entry.draft ? '[draft]' : ''}</p>
								<p><strong>ID:</strong> {entry.id}</p>
								<p><strong>Weight:</strong> {entry.weight ? entry.weight : 'No weight defined.'}</p>
								</>
							}
							</div>
							<div className="column is-narrow">
							<div id={`entry-dropdown-${entry.id}`} className="dropdown is-right is-hoverable">
							<div className="dropwdown-trigger">
								<button className="button" aria-haspopup="true" aria-controls={`dropdown-entry-menu-${entry.id}`} onClick={
									() => { 
										const dropdownElement = document.querySelector(`#entry-dropdown-${entry.id}`);
										dropdownElement?.classList.toggle('is-active');
									}
								}>
									<span>Options</span>
									<span className="icon is-small">
										<i className="fas fa-angle-down" aria-hidden="true"></i>
									</span>
								</button>
							</div>
							<div className="dropdown-menu" id={`dropdown-entry-menu-${entry.id}`} role="menu">
							<div className="dropdown-content">
								<div className="dropdown-item">
								<button 
									type="button" 
									className="button is-info is-small"
									data-entry-id={entry.id} 
									onClick={handleEditEntry}
								>
									Edit Data
								</button>
								</div>
								<div className="dropdown-item">
								<button 
									type="button" 
									className={`button ${entry.marks && Object.keys(entry.marks).length  == 3 ? 'is-success' : 'is-warning'} is-small`}
									data-entry-id={entry.id} 
									onClick={handleMarkEntry}
								>
									{ 'Mark (' + ( entry.marks ? Object.keys(entry.marks).length : 0) + ')'}
								</button>
								</div>
								<div className="dropdown-item">
								<button 
									type="button" 
									className="button is-info is-small"
									data-entry-id={entry.id} 
									onClick={handleChangeImageEntry}
								>
									Change Image
								</button>
								</div>
								<div className="dropdown-item">
								<button 
									type="button" 
									className="button is-danger is-small"
									data-entry-id={entry.id} 
									onClick={handleDeleteEntry}
								>
									Delete
								</button>
								</div>
								<div className="dropdown-item">
								<button 
									type="button" 
									className="button is-info is-small"
									data-entry-id={entry.id} 
									onClick={handleDuplicateEntry}
								>
									Duplicate
								</button>
								</div>
							</div>
							</div>
							</div>
							</div>
							</div>
							{ getEntryValidationErrorsComponent(entry) }
						</li>
					)
				}
				</ol>
				{ 
					/*entries?.map( entry => 
						<div key={entry.id} style={{border: '1px solid black', padding: '1rem', margin: '1rem'}}>
							<p>{entry.weight} @ {entry.date}</p>
							<img src={entry.image} style={{maxWidth: '30rem'}}/>
							<button type="button" data-entry-id={entry.id} onClick={handleDeleteEntry}>Delete</button>
						</div> )*/
				}
				<Routes>
				<Route 
					path="/add/:entryId/*"
					element={
						<AddEntryModal 
							globalState={globalState} 
							setGlobalState={setGlobalState} 
						/>
					}
				/>
				<Route 
					path="/mark/:entryId/*"
					element={
						<MarkImageModal 
							globalState={globalState} 
							setGlobalState={setGlobalState} 
						/>
					}
				/>
				<Route 
					path="/change_image/:entryId/*"
					element={
						<ChangeImageModal/>
					}
				/>
				</Routes>
			</div>
    </div>
  );
}

export default EntryComponent;
