import 
	React, 
	{
		useState,
		useRef,
		useEffect,
		Dispatch, 
		SetStateAction,
		ChangeEvent,
		MouseEvent
	}
from 'react';
import { useLiveQuery } from 'dexie-react-hooks';

//import './Adjust.css';
import { db, Entry } from './db';
import { GlobalState  } from './App';

type AdjustAttributes = {
	globalState: GlobalState;
	setGlobalState: Dispatch<SetStateAction<GlobalState>>;
}

function Adjust({
	globalState,
	setGlobalState
}:AdjustAttributes) {
	let [cropAdjustActive, setCropAdjustActive] = useState(false);
	let [currentSelectValue, setCurrentSelectValue] = useState(-1);

	const imageSelectRef = useRef<HTMLSelectElement>(null);

	const entries = useLiveQuery(
		() => db.entries.orderBy('date').reverse().toArray()
	);

	let chosenEntryIdForAdjustments = useLiveQuery( () => {
		return db.settings.get('chosenEntryIdForAdjustments')
	});

	let currentEntry = useLiveQuery(
		() => {
			if(chosenEntryIdForAdjustments) {
				console.log('setting currentEntry');
				return db.entries.get( parseInt(chosenEntryIdForAdjustments.value as string) );
			}
		}
	, [chosenEntryIdForAdjustments]);
	

	useEffect( () => {
		if(
			chosenEntryIdForAdjustments
			&& chosenEntryIdForAdjustments.value
		) {
			setCurrentSelectValue( parseInt(chosenEntryIdForAdjustments.value as string));
		}
	}, [chosenEntryIdForAdjustments]);
	
	let handleSelectOnChange = (event:ChangeEvent<HTMLSelectElement>) => {
		console.log('handleSelectOnChange() called');
		if(
			event
			&& event.target
			&& event.target.value
		) {
			/*setGlobalState( (cs):GlobalState => {
				const ns = { currentEntryId: parseInt(event.target.value) };
				return { ...cs, ...ns};
			});*/
			setCurrentSelectValue( parseInt(event.target.value) );
		}
	};

	let handleSelectImage = async () => {
		console.log('handleSelectImage() called');
		if(
			imageSelectRef.current
			&& imageSelectRef.current.value
		) {
			try {
				const id = await db.settings.put(
					{ key: 'chosenEntryIdForAdjustments', value: parseInt(imageSelectRef.current.value) }, 
				);
				console.log('new id =', id);
			} catch(error) {
				console.error(`failed to add db entry. ${error}`);
			}
		}
	};
		

	let handleAdjustCropping = (event: MouseEvent<HTMLButtonElement>) => {
		console.log('handleAdjustCropping() called');
		setCropAdjustActive( cs => !cs);
	};
 
	console.log('RENDER!');
 
	return (
    <div>
    	<h2>Adjust ( id = {globalState.currentEntryId}, chosenEntryIdForAdjustments = {chosenEntryIdForAdjustments?.value} )</h2>
			<p>All images must be cropped and/or scaled to be the same size. On this page, configure the desired size and, if needed, cropping.</p>
			<select ref={imageSelectRef} value={currentSelectValue} onChange={handleSelectOnChange}>
				{
					entries?.map( (entry) => 
						<option key={entry.id} value={entry.id}>{entry.id}: {entry.date}</option>
					)
				}
			</select>
			<button
				type="button"
				onClick={handleSelectImage}
			>
				Select Image as Base for Adjustments
			</button>
			<hr/>
			<button
				type="button"
				onClick={handleAdjustCropping}
			>
				Adjust Cropping { cropAdjustActive ? 'Y' : 'N' }
			</button>
			<label>Width:
				<input type="text" defaultValue="123" />
			</label>
			<label>Height:
				<input type="text" defaultValue="123" />
			</label>
			<div>
				<img src={currentEntry?.image} style={{maxWidth: '25rem'}}/>
				<p>{currentEntry?.id} date = {currentEntry?.date}</p>
			</div>
		</div>
  );
}


export default Adjust;
