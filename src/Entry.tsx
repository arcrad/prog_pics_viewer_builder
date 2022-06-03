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
import { EntryValidationErrorsList, PaginationControls } from './Common';
 
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
					let newData = {
						[currentEntry.id as number]: URL.createObjectURL(currentEntry.thumbImageBlob)
					};
					return { ...accumulator, ...newData};
				}
				return accumulator;
			}, {});
			console.dir(entryThumbnailUrls);
			setEntryThumbnailImageUrls(entryThumbnailUrls);
		}
	}, [entries]);

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
			setAddEntryModalIsVisible(true);
			navigate(`./add/${id}/image`);
		} catch(error) {
			console.error(`failed to add db entry. ${error}`);
		}
	};

	const handleDeleteEntry = async (event:MouseEvent<HTMLButtonElement>) => {
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

	return (
		<>
    <div className="columns is-centered">
			<div className="column is-10-tablet is-6-desktop">
				<div className="section">
					<div className="control">
						<button 
							ref={addEntryRef} 
							type="button" 
							className="button is-primary is-large" 
							onClick={handleAddEntry}>
								Create New Entry
						</button>
					</div>
				</div>
				<PaginationControls
					curPage={pagerOffset/pagerLimit}
					maxPage={totalEntriesCount ? Math.floor((totalEntriesCount-1)/pagerLimit) : 0} 
					pagerOffset={pagerOffset}
					pagerLimit={pagerLimit}
					totalEntriesCount={totalEntriesCount || 0}
					setPagerOffset={setPagerOffset}
				/>
				{ !entries || entries.length == 0 && <p>No entries yet...</p> }
				<ol start={pagerOffset+1}>
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
								}}>
									{entryThumbnailImageUrls[entry.id] == null ? 'no image' : ''}
								</div>
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
							<EntryValidationErrorsList entry={entry}/>
						</li>
					)
				}
				</ol>
			</div>
    </div>
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
		</>
  );
}

export default EntryComponent;
