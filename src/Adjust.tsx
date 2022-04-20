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

import './Adjust.css';
import { db, Entry } from './db';
import { GlobalState  } from './App';

type AdjustAttributes = {
	globalState: GlobalState;
	setGlobalState: Dispatch<SetStateAction<GlobalState>>;
}

type CropCornerCoordinate = {
	x: number,
	y: number
}

function Adjust({
	globalState,
	setGlobalState
}:AdjustAttributes) {
	let [cropAdjustActive, setCropAdjustActive] = useState(false);
	let [currentSelectValue, setCurrentSelectValue] = useState(-1);
	let [scaleWidth, setScaleWidth] = useState('0');
	let [scaleHeight, setScaleHeight] = useState('0');

	let [topLeftCornerCoordinate, setTopLeftCornerCoordinate] 
		= useState<CropCornerCoordinate>({ x: 0, y:0});
	let [topRightCornerCoordinate, setTopRightCornerCoordinate] 
		= useState<CropCornerCoordinate>({ x: 0, y:0});
	let [bottomRightCornerCoordinate, setBottomRightCornerCoordinate] 
		= useState<CropCornerCoordinate>({ x: 0, y:0});
	let [bottomLeftCornerCoordinate, setBottomLeftCornerCoordinate] 
		= useState<CropCornerCoordinate>({ x: 0, y:0});

	//let [activeCornerControl, setActiveCornerControl] = useState("none");
	const activeCornerControl = useRef('none');

	const topLeftCornerControl = useRef<HTMLDivElement>(null);	
	const topRightCornerControl = useRef<HTMLDivElement>(null);	
	const bottomRightCornerControl = useRef<HTMLDivElement>(null);	
	const bottomLeftCornerControl = useRef<HTMLDivElement>(null);	
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
		let handleMouseDown = (event: any) => {
			console.log('handleMouseDown() called');
			//console.dir(event.target);
			if(event.target.classList.contains('cropCornerControl')) {
			event.preventDefault();
				console.log('target is cropCornerControl');
				console.log('controlId = ', event.target.dataset.controlId);
				activeCornerControl.current = event.target.dataset.controlId;
				/*if(event.target.dataset.controlId === 'topLeft') {
					
				} else if(event.target.dataset.controlId === 'topRight') {
				} else if(event.target.dataset.controlId === 'bottomRight') {
				} else if(event.target.dataset.controlId === 'bottomLeft') {
				}	*/
			}
		}
		let handleMouseUp = (event: any) => {
			activeCornerControl.current = 'none';
		}
		let handleMouseMove = (event: any) => {
			//console.dir(event);
			if(activeCornerControl.current === 'topLeft') {
				setTopLeftCornerCoordinate({x: event.pageX, y:event.pageY});
			} else if(activeCornerControl.current === 'topRight') {
				setTopRightCornerCoordinate({x: event.pageX, y:event.pageY});
			} else if(activeCornerControl.current === 'bottomRight') {
				setBottomRightCornerCoordinate({x: event.pageX, y:event.pageY});
			} else if(activeCornerControl.current === 'bottomLeft') {
				setBottomLeftCornerCoordinate({x: event.pageX, y:event.pageY});
			}		
		}

		window.addEventListener('mousedown', handleMouseDown);
		window.addEventListener('mouseup', handleMouseUp);
		window.addEventListener('mousemove', handleMouseMove);
		
		return( () => {
			window.removeEventListener('mousedown', handleMouseDown);
			window.removeEventListener('mouseup', handleMouseUp);
			window.removeEventListener('mousemove', handleMouseMove);

		});
				
	}, []);
	
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
 
	const handleCornerControlMouseDown = (event: MouseEvent<HTMLDivElement>) => {
		console.log('handleCornerControlMouseDown() called');
	};

	const handleCornerControlMouseUp = (event: MouseEvent<HTMLDivElement>) => {
		console.log('handleCornerControlMouseUp() called');
	};
	
	//console.log('RENDER!');
 
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
				<div className="cropImageContainer">
					<img src={currentEntry?.image} style={{ maxWidth: '90vw', maxHeight: '90vh'}}/>
					<div 
						ref={topLeftCornerControl} 
						data-control-id="topLeft" 
						className="cropCornerControl"
						onMouseDown={handleCornerControlMouseDown}
						onMouseUp={handleCornerControlMouseUp}
						style={{
							left: topLeftCornerCoordinate.x,
							top: topLeftCornerCoordinate.y,
							background: 'red'
						}}
					>
					</div>
					<div 
						ref={topRightCornerControl} 
						data-control-id="topRight" 
						className="cropCornerControl"
						onMouseDown={handleCornerControlMouseDown}
						onMouseUp={handleCornerControlMouseUp}
						style={{
							left: topRightCornerCoordinate.x,
							top: topRightCornerCoordinate.y,
							background: 'green'
						}}
					>
					</div>
					<div 
						ref={bottomRightCornerControl} 
						data-control-id="bottomRight" 
						className="cropCornerControl"
						onMouseDown={handleCornerControlMouseDown}
						onMouseUp={handleCornerControlMouseUp}
						style={{
							left: bottomRightCornerCoordinate.x,
							top: bottomRightCornerCoordinate.y,
							background: 'blue'
						}}
					>
					</div>
					<div 
						ref={bottomLeftCornerControl} 
						data-control-id="bottomLeft" 
						className="cropCornerControl"
						onMouseDown={handleCornerControlMouseDown}
						onMouseUp={handleCornerControlMouseUp}
						style={{
							left: bottomLeftCornerCoordinate.x,
							top: bottomLeftCornerCoordinate.y,
							background: 'purple'
						}}
					>
					</div>
				</div>
				<p>{currentEntry?.id} date = {currentEntry?.date}</p>
			</div>
		</div>
  );
}


export default Adjust;
