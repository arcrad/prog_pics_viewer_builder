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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
	faPenToSquare, 
	faLocationCrosshairs, 
	faImage,
	faTrash,
	faTrashAlt,
	faClone,
	faXmark,
	faCircleXmark,
} from '@fortawesome/free-solid-svg-icons'

import { db, Entry } from './db';
import { GlobalState } from './App';
import ViewBaseImageModal from './ViewBaseImageModal';
import ChangeImageModal from './ChangeImageModal';
import MarkImageModal from './MarkImageModal';
import AddEntryModal from './AddEntryModal';
import { 
	LoadingIndicator,
	EntryValidationErrorsList, 
	PaginationControls,
	EntryOptionsDropdown,
	getLocalDateStringFormattedForDateInput
} from './Common';
 
type EntryAttributes = {
	globalState: GlobalState,
	setGlobalState: Dispatch<SetStateAction<GlobalState>>
};

function EntryComponent({
	globalState, 
	setGlobalState
} : EntryAttributes ) {

	let [currentEntryWeight, setCurrentEntryWeight] = useState("");
	let [currentEntryDate, setCurrentEntryDate] = useState("");
	let [currentEntryNotes, setCurrentEntryNotes] = useState("");
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
		]
	);

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
						[currentEntry.id as number]: URL.createObjectURL(new Blob([currentEntry.thumbImageBlob.buffer]))
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
		console.log("handle add entry..");
 		try {
			const now = new Date();
			//const date = ((new Date()).toISOString()).substring(0, 16) + ':00'; 
			const date = ((new Date()).toISOString()).substring(0, 16) + ':00Z'; 
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
	 	//console.dir(event.target);
	 	if(!window.confirm('Are you sure you want to delete this entry?')) {
			return;
		}
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
						marks: entryToDuplicate.marks,
						includeInExport: entryToDuplicate.includeInExport
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
			const entryIdSpecified = parseInt(event.target.dataset.entryId);
			if(entryIdBeingEdited == entryIdSpecified) {
				setEntryIdBeingEdited(-1);
			} else {
				setEntryIdBeingEdited(entryIdSpecified);
			}
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
	const handleEntryInputChange = async (event:ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => {
		console.log('handleEntryInputChange');
		if(
			event.target
			&& ( 
				event.target instanceof HTMLInputElement 
				|| event.target instanceof HTMLTextAreaElement
			)
			&& event.target.dataset.entryId
			&& event.target.dataset.entryKeyToModify
		) {
			let entryIdToModify = parseInt(event.target.dataset.entryId);
			let entryKeyToModify = event.target.dataset.entryKeyToModify;
			let newValue:string|number = event.target.value;
			console.log('entryId = ', entryIdToModify);
			console.log('entryKeyToModify = ', entryKeyToModify);
			console.log('value = ', newValue);
			if(event.target.dataset.entryKeyToModify === 'weight') {
				//setCurrentEntryWeight(event.target.value);
				newValue = parseFloat(event.target.value);
			} else if(event.target.dataset.entryKeyToModify === 'date') {
				//setCurrentEntryDate(event.target.value);
				//convert user-supplied date to UTC in truncated format 
				newValue = ((new Date(event.target.value)).toISOString()).substring(0, 16) + ':00Z'; 
			} else if(event.target.dataset.entryKeyToModify === 'notes') {
				//setCurrentEntryNotes(event.target.value);
			} else if(event.target.dataset.entryKeyToModify === 'includeInExport') {
				newValue = event.target.checked;
			}
			clearTimeout(debounceInputTimeout.current);
			let modifyDbValueHandler = () => {
					console.log(`fire update db with new input newValue=${newValue}, entryIdToModify=${entryIdToModify}`);
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
			<div className="columns is-mobile is-centered">
				<div className="column is-12">
					<div className="hero is-small is-primary">
						<div className="hero-body">
    					<h2 className="title">Entries</h2>
							<p className="subtitle">Create entries and manage entry data.</p>
						</div>
					</div>
				</div>
			</div>
			{ 
				(!entries) && 
				<LoadingIndicator/>
			}
			{ (entries) &&
    <div className="columns is-mobile is-centered">
			<div className="column is-11-mobile is-10-tablet is-8-desktop">
				<div className="section">
					<div className="control has-text-centered	">
						<button 
							ref={addEntryRef} 
							type="button" 
							className="button is-primary is-large" 
							onClick={handleAddEntry}>
								Create New Entry
						</button>
					</div>
					<p className="has-text-centered mt-3">Total Entries: { totalEntriesCount }</p>
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
							<div className="columns is-centered is-mobile">
							<div className="column is-narrow">
							{ entryThumbnailImageUrls && entry.id && entryThumbnailImageUrls[entry.id] != null &&
								<a onClick={ () => {
									if( entryThumbnailImageUrls[entry.id] != null) {
										navigate(`./image/${entry.id}`);
									}
								}}>
								<div style={{
									border: '0px solid #000',
									height: '7rem',
									width: '7rem',
									background: `url(${entryThumbnailImageUrls[entry.id]}) center / contain no-repeat #ded`,
								}}>
								</div>
								</a>
							}
							{ entryThumbnailImageUrls && entry.id && entryThumbnailImageUrls[entry.id] == null &&
								<div style={{
									border: '0px solid #000',
									height: '7rem',
									width: '7rem',
									background: `#ded`,
									display: 'flex',
									justifyContent: 'center',
									alignItems: 'center'
								}}>
									No image
								</div>
							}
							</div>
							<div className="column">
							{ ( entryIdBeingEdited === entry.id ) ? 
								<>
									<div className="field">
										<label className="label">Date</label>
										<div className="control">
											<input 
												type="datetime-local" 
												className="input is-small"
												defaultValue={getLocalDateStringFormattedForDateInput(entry.date)}
												data-entry-id={entry.id} 
												data-entry-key-to-modify="date"
												onBlur={handleEntryInputChange}
											/>
										</div>
									</div>
									<div className="field">
										<label className="label">Weight</label>
										<div className="control">
											<input 
												type="number" 
												className="input is-small"
												defaultValue={entry.weight} 
												data-entry-id={entry.id} 
												data-entry-key-to-modify="weight" 
												onChange={handleEntryInputChange}
											/>
										</div>
									</div>
									<div className="field">
										<label className="label">Notes</label>
										<div className="control">
											<textarea
												className="textarea is-small"
												defaultValue={entry.notes} 
												data-entry-id={entry.id} 
												data-entry-key-to-modify="notes" 
												onChange={handleEntryInputChange}
											/>
										</div>
									</div>
									<div className="field">
										<label className="checkbox">
												<input 
													type="checkbox" 
													defaultChecked={entry.includeInExport} 
													data-entry-id={entry.id} 
													data-entry-key-to-modify="includeInExport" 
													onChange={handleEntryInputChange}
												/> Include in Export?
										</label>
									</div>
									<div className="field">
										<div className="control">
											<button 
												type="button" 
												className="button is-small"
												data-entry-id="-1" 
												onClick={handleEditEntry}
											>
												Close
											</button>
									</div>
								</div>
									<p><i>Entry id = {entry.id}</i></p>
								</>
								:
								<>
		 							<p>
										<strong>Date: </strong>
										{(new Date(entry.date)).toLocaleString()} { entry.draft ? '[draft]' : ''}
									</p>
									<p>
										<strong>ID: </strong> 
										{entry.id}
									</p>
									<p>
										<strong>Weight: </strong> 
										{ 
											entry.weight ? 
												entry.weight 
												: 
												<i>No weight defined</i>
										}
									</p>
									<p>
										<strong>Notes: </strong> 
										{
											entry.notes ? 
												entry.notes 
												: 
												<i>No notes.</i>
										}
									</p>
								</>
							}
							</div>
						</div>
						<div className="columns is-variable is-2-mobile is-1 is-centered is-multiline is-mobile">
							<div className="column is-narrow">
							{/*<EntryOptionsDropdown entryId={entry.id || 0}>*/}
								<button 
									type="button" 
									className="button is-info"
									title="Edit Data"
									data-entry-id={entry.id} 
									onClick={handleEditEntry}
								>
									<span className="pe-none is-hidden-touch">
										{ ( entryIdBeingEdited === entry.id ) ? 
											<>Close Edit&nbsp;</>
											:
											<>Edit Data&nbsp;</>
										}
									</span>
									{ ( entryIdBeingEdited === entry.id ) ? 
										<FontAwesomeIcon 
											className="pe-none"
											icon={faXmark}
										/>
										:
										<FontAwesomeIcon 
											className="pe-none"
											icon={faPenToSquare}
										/>
									}
								</button>
							</div>
							<div className="column is-narrow">
								<button 
									type="button" 
									className={`button ${entry.marks && Object.keys(entry.marks).length  == 3 ? 'is-success' : 'is-warning'}`}
									title="Mark"
									data-entry-id={entry.id} 
									onClick={handleMarkEntry}
								>
									<span className="pe-none is-hidden-touch">
										Mark&nbsp;
									</span>
									<FontAwesomeIcon 
										className="pe-none"
										icon={faLocationCrosshairs}
									/>
									<span className="pe-none">
										&nbsp;{ '(' + ( entry.marks ? Object.keys(entry.marks).length : 0) + ')'}
									</span>
								</button>
							</div>
							<div className="column is-narrow">
								<button 
									type="button" 
									className="button is-info"
									title="Change Image"
									data-entry-id={entry.id} 
									onClick={handleChangeImageEntry}
								>
									<span className="pe-none is-hidden-touch">
										Change Image&nbsp;
									</span>
									<FontAwesomeIcon 
										className="pe-none"
										icon={faImage}
									/>
								</button>
							</div>
							<div className="column is-narrow">
								<button 
									type="button" 
									className="button is-danger"
									title="Delete"
									data-entry-id={entry.id} 
									onClick={handleDeleteEntry}
								>
									<span className="pe-none is-hidden-touch">
										Delete&nbsp;
									</span>
									<FontAwesomeIcon 
										className="pe-none"
										icon={faTrashAlt}
									/>
								</button>
							</div>
							<div className="column is-narrow">
								<button 
									type="button" 
									className="button is-info"
									title="Duplicate"
									data-entry-id={entry.id} 
									onClick={handleDuplicateEntry}
								>
									<span className="pe-none is-hidden-touch">
										Duplicate&nbsp;
									</span>
									<FontAwesomeIcon 
										className="pe-none"
										icon={faClone}
									/>
								</button>
							</div>
							
							</div>
							<EntryValidationErrorsList 
								entry={entry}
								showIsValid={false}
							/>
						</li>
					)
				}
				</ol>
				{
					entries 
					&& entries.length > 2
					&&
					<div className="my-5">
						<PaginationControls
							curPage={pagerOffset/pagerLimit}
							maxPage={totalEntriesCount ? Math.floor((totalEntriesCount-1)/pagerLimit) : 0} 
							pagerOffset={pagerOffset}
							pagerLimit={pagerLimit}
							totalEntriesCount={totalEntriesCount || 0}
							setPagerOffset={setPagerOffset}
						/>
					</div>
				}
			</div>
    </div>
		}
				<Routes>
				<Route 
					path="/image/:entryId/*"
					element={
						<ViewBaseImageModal/>
					}
				/>
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
