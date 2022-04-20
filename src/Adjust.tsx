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
	let [scaleWidth, setScaleWidth] = useState('0');
	let [scaleHeight, setScaleHeight] = useState('0');
	
const imageSelectRef = useRef<HTMLSelectElement>(null);

	const entries = useLiveQuery(
		() => db.entries.orderBy('date').reverse().toArray()
	);

	let chosenEntryIdForAdjustments = useLiveQuery( () => {
		return db.settings.get('chosenEntryIdForAdjustments')
	});
	
	let scaleWidthSetting = useLiveQuery( () => {
		return db.settings.get('scaleWidth')
	});
	
	let scaleHeightSetting = useLiveQuery( () => {
		return db.settings.get('scaleHeight')
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
		if(scaleWidthSetting) {
			setScaleWidth(scaleWidthSetting.value as string);
		}
		if(scaleHeightSetting) {
			setScaleHeight(scaleHeightSetting.value as string);
		}
	}, [scaleWidthSetting, scaleHeightSetting]);
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
			//console.log('get entry with id = ', imageSelectRef.current.value );
			const newEntry = await db.entries.get( parseInt(imageSelectRef.current.value) );
			//console.log('newEntry = ');
			//console.dir(newEntry);
			if(newEntry && newEntry.image) {
				let image = new Image();
				image.src = newEntry.image;
				//console.dir(image);
				image.onload = async () => {
				console.log('image width = ',image.naturalWidth, 'image height = ', image.naturalHeight);
				try {
					const id = await db.settings.put(
						{ key: "scaleWidth", value: image.naturalWidth }
					);
					const id2 = await db.settings.put(
						{ key: "scaleHeight", value: image.naturalHeight }
					);
					console.log('new id1 =', id, 'new id2 = ', id2);
				} catch(error) {
					console.error(`failed to add db entry. ${error}`);
				}
				}
			}
			
		}
	};
		

	const handleAdjustCropping = (event: MouseEvent<HTMLButtonElement>) => {
		console.log('handleAdjustCropping() called');
		setCropAdjustActive( cs => !cs);
	};
	
	let debounceInputTimeout = useRef(0);
	const handleInputChange = async (event:ChangeEvent<HTMLInputElement>) => {
		console.log('handleInputChange() called');
		if(
			event.target
			&& event.target instanceof HTMLInputElement
			&& event.target.dataset.settingsKeyToModify
		) {
			let settingsKeyToModify = event.target.dataset.settingsKeyToModify;
			let newValue = event.target.value;
			console.log('settingsKeyToModify = ', settingsKeyToModify);
			console.log('value = ', newValue);
			if(event.target.dataset.settingsKeyToModify === 'scaleWidth') {
				setScaleWidth(newValue);
			} else if(event.target.dataset.settingsKeyToModify === 'scaleHeight') {
				setScaleHeight(newValue);
			}
			clearTimeout(debounceInputTimeout.current);
			let modifyDbValueHandler = async () => {
					console.log('fire update db with new input', newValue, settingsKeyToModify);
						try {
							const id = await db.settings.put(
								{ key: settingsKeyToModify, value: parseInt(newValue) }, 
							);
							console.log('new id =', id);
						} catch(error) {
							console.error(`failed to add db entry. ${error}`);
						}
			};

			debounceInputTimeout.current = window.setTimeout( modifyDbValueHandler, 500);
		}
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
				<input type="text" value={scaleWidth} data-settings-key-to-modify="scaleWidth" onChange={handleInputChange} />
			</label>
			<label>Height:
				<input type="text" value={scaleHeight} data-settings-key-to-modify="scaleHeight" onChange={handleInputChange} />
			</label>
			<div>
				<img src={currentEntry?.image} style={{maxWidth: '25rem'}}/>
				<p>{currentEntry?.id} date = {currentEntry?.date}</p>
			</div>
		</div>
  );
}


export default Adjust;
