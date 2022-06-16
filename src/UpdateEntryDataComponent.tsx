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
import {
	useParams
} from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';

import { db, Entry } from './db';
import { GlobalState } from './App';
//import './UpdateEntryDataComponent.css';

type UpdateEntryDataComponentAttributes= {
	//globalState: GlobalState;
	//setGlobalState: Dispatch<SetStateAction<GlobalState>>;
	afterUpdateFn?: () => void;
};

function UpdateEntryDataComponent({
	//globalState, 
	//setGlobalState,
	afterUpdateFn,
} : UpdateEntryDataComponentAttributes ) {
	let [isLoaded, setIsLoaded] = useState<boolean>(false);
	let [currentEntry, setCurrentEntry] = useState<Entry|null>(null);
	let [currentEntryWeight, setCurrentEntryWeight] = useState(0);
	let [currentEntryDate, setCurrentEntryDate] = useState("jan 1, 1970");
	let [statusMessages, setStatusMessages] = useState<string[]>([]);
	
	const initialized = useRef<boolean>(false);

	let { entryId } = useParams();
	
	useEffect( () => {
		//fetch all initial data and then set intializedData flag 	
		if(entryId == null) {
			console.error('no entryId');
			return;
		}
		console.warn('INITIALIZER FIRED!');
		if(initialized.current) {
				console.log('already initialized, aborting');
				return;
		}
		console.log('fetch all initial data and then set intializedData flag');
		initialized.current = true;
		//db.settings.get('chosenEntryIdForAdjustments').then((_chosenEntryIdForAdjustments) => {
			Promise.all([
				db.entries.get(parseInt(entryId)),
			]).then(([
				_currentEntry,
			]) => {
				if(_currentEntry) {
					console.log('_currentEntry=');
					console.dir(_currentEntry);
					setCurrentEntry(_currentEntry);
					/*
					if(_currentEntry.weight) {
						setCurrentEntryWeight(_currentEntry.weight);
					}
					if(_currentEntry.date) {
						setCurrentEntryDate(_currentEntry.date);
					}
					*/
				}
				setIsLoaded(true);
				console.group('got data from db'); 
			});
		//});
	}, [initialized.current, entryId]);

	let debounceInputTimeout = useRef(0);
	const handleEntryInputChange = async (event:ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => {
		console.log('handleEntryInputChange');
		if(
			event.target
			&& ( event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement )
			&& event.target.dataset.entryId
			&& event.target.dataset.entryKeyToModify
		) {
			let entryIdToModify = parseInt(event.target.dataset.entryId);
			let entryKeyToModify = event.target.dataset.entryKeyToModify;
			let newValue = event.target.value;
			console.log('entryId = ', entryIdToModify);
			console.log('entryKeyToModify = ', entryKeyToModify);
			console.log('value = ', newValue);
			/*
			if(event.target.dataset.entryKeyToModify === 'weight') {
				setCurrentEntryWeight(parseFloat(event.target.value as string));
			} else if(event.target.dataset.entryKeyToModify === 'date') {
				setCurrentEntryDate(event.target.value);
			} else if(event.target.dataset.entryKeyToModify === 'notes') {
				setCurrentEntryNotes(event.target.value);
			}
			*/
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
				<p className="mb-4">Update data about this entry. Date and weight are required to pass all validations.</p>
				<div className="field">
					<label className="label">Date</label>
					<div className="control">
						<input 
							type="datetime-local" 
							className="input"
							defaultValue={currentEntry?.date}
							data-entry-id={currentEntry?.id} 
							data-entry-key-to-modify="date"
							onChange={handleEntryInputChange}
						/>
					</div>
				</div>
				<div className="field">
					<label className="label">Weight</label>
					<div className="control">
						<input
							type="number"
							className="input"
							defaultValue={currentEntry?.weight} 
							data-entry-id={currentEntry?.id} 
							data-entry-key-to-modify="weight" 
							onChange={handleEntryInputChange}
						/>
					</div>
				</div>
				<div className="field">
					<label className="label">Notes</label>
					<div className="control">
						<textarea
							className="textarea"
							data-entry-id={currentEntry?.id} 
							data-entry-key-to-modify="notes"
							onChange={handleEntryInputChange}
							defaultValue={currentEntry?.notes}
						>
						</textarea>
					</div>
				</div>
			</>
  );
}

export default UpdateEntryDataComponent;
