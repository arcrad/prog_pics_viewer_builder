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

import { db, Entry } from './db';
import { GlobalState } from './App';
//import './UpdateEntryDataComponent.css';

type UpdateEntryDataComponentAttributes= {
	globalState: GlobalState;
	setGlobalState: Dispatch<SetStateAction<GlobalState>>;
	isModalVisible: boolean;
	setIsModalVisible: Dispatch<SetStateAction<boolean>>;
	afterUpdateFn?: () => void;
};

function UpdateEntryDataComponent({
	globalState, 
	setGlobalState,
	isModalVisible,
	setIsModalVisible,
	afterUpdateFn,
} : UpdateEntryDataComponentAttributes ) {
	let [isLoaded, setIsLoaded] = useState<boolean>(false);
	let [currentEntry, setCurrentEntry] = useState<Entry|null>(null);
	let [currentEntryWeight, setCurrentEntryWeight] = useState(0);
	let [currentEntryDate, setCurrentEntryDate] = useState("jan 1, 1970");
	let [statusMessages, setStatusMessages] = useState<string[]>([]);
	
	const initialized = useRef<boolean>(false);

	useEffect( () => {
		//fetch all initial data and then set intializedData flag 	
		console.warn('INITIALIZER FIRED!');
		if(initialized.current) {
				console.log('already initialized, aborting');
				return;
		}
		console.log('fetch all initial data and then set intializedData flag');
		initialized.current = true;
		//db.settings.get('chosenEntryIdForAdjustments').then((_chosenEntryIdForAdjustments) => {
			Promise.all([
				db.entries.get(globalState.currentEntryId),
			]).then(([
				_currentEntry,
			]) => {
				if(_currentEntry) {
					setCurrentEntry(_currentEntry);
					if(_currentEntry.weight) {
						setCurrentEntryWeight(_currentEntry.weight);
					}
					if(_currentEntry.date) {
						setCurrentEntryDate(_currentEntry.date);
					}
				}
				setIsLoaded(true);
				console.group('got data from db'); 
			});
		//});
	}, [initialized.current]);

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
				setCurrentEntryWeight(parseFloat(event.target.value as string));
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
				<h1>Update Entry Data</h1>
				<p>Updating entry with id = { globalState.currentEntryId }.</p>
					<div>
						Weight: 
						<input 
							type="number" 
							defaultValue={currentEntry?.weight} 
							data-entry-id={currentEntry?.id} 
							data-entry-key-to-modify="weight" 
							onChange={handleEntryInputChange}
						/> on&nbsp;
						<input 
							type="datetime-local" 
							defaultValue={currentEntry?.date}
							data-entry-id={currentEntry?.id} 
							data-entry-key-to-modify="date"
							onChange={handleEntryInputChange}
						/>
					</div> 
				<button type="button">
					Save
				</button>
			</>
  );
}

export default UpdateEntryDataComponent;
