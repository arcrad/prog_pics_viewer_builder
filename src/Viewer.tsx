import React, { useState, useRef, useEffect, Dispatch, SetStateAction } from 'react';
//import './Viewer.css';
import { db, Entry, Setting } from './db';
import { GlobalState } from './App';

type ViewerAttributes = {
	globalState: GlobalState;
	setGlobalState: Dispatch<SetStateAction<GlobalState>>;
}

function Viewer({
	globalState,
	setGlobalState
}:ViewerAttributes) {
	let [loadedData, setLoadedData] = useState(false);
	let [totalEntries, setTotalEntries] = useState(0);
	let [entriesProcessed, setEntriesProcessed] = useState(0);
	let [processingState, setProcessingState] = useState('unstarted');
	let [entries, setEntries] = useState<Entry[]>([]);

	const initializedRef = useRef(false);
	const originalCoordinatesFromDbRef = useRef<any[]>([]);
	const scaleWidthSettingRef = useRef(0);
	const scaleHeightSettingRef = useRef(0);
	const sortedEntriesRef = useRef<Entry[]>([]);

	useEffect( () => {
		//fetch all initial data and then set intializedData flag 	
		console.warn('INITIALIZER FIRED!');
		if(initializedRef.current) {
				console.log('already initialized, aborting');
				return;
		}
		console.log('fetch all initial data and then set loadedData flag');
		initializedRef.current = true;
		//db.settings.get('chosenEntryIdForAdjustments').then((_chosenEntryIdForAdjustments) => {
			Promise.all([
				db.settings.get('topLeftCornerCropCoordinateX'),
				db.settings.get('topLeftCornerCropCoordinateY'),
				db.settings.get('topRightCornerCropCoordinateX'),
				db.settings.get('topRightCornerCropCoordinateY'),
				db.settings.get('bottomRightCornerCropCoordinateX'),
				db.settings.get('bottomRightCornerCropCoordinateY'),
				db.settings.get('bottomLeftCornerCropCoordinateX'),
				db.settings.get('bottomLeftCornerCropCoordinateY'),
				db.entries.orderBy('date').reverse().toArray(),
				db.settings.get('scaleWidth'),
				db.settings.get('scaleHeight'),
				//db.entries.get( parseInt(_chosenEntryIdForAdjustments?.value as string) )
			]).then(([
				_topLeftCornerCropCoordinateX,
				_topLeftCornerCropCoordinateY,
				_topRightCornerCropCoordinateX,
				_topRightCornerCropCoordinateY,
				_bottomRightCornerCropCoordinateX,
				_bottomRightCornerCropCoordinateY,
				_bottomLeftCornerCropCoordinateX,
				_bottomLeftCornerCropCoordinateY,
				_sortedEntries,
				_scaleWidthSetting,
				_scaleHeightSetting,
				//_currentEntry
			]) => {
				console.group('got data from db'); 
				//console.log('got data from db'); 
				//console.dir(coordinates);
				//	originalCoordinatesFromDbRef.current = coordinates;
				if(_sortedEntries) {
					sortedEntriesRef.current = _sortedEntries;
				}

				originalCoordinatesFromDbRef.current = [
					_topLeftCornerCropCoordinateX,
					_topLeftCornerCropCoordinateY,
					_topRightCornerCropCoordinateX,
					_topRightCornerCropCoordinateY,
					_bottomRightCornerCropCoordinateX,
					_bottomRightCornerCropCoordinateY,
					_bottomLeftCornerCropCoordinateX,
					_bottomLeftCornerCropCoordinateY,
				];
				//updateScaledCornerCropCoordinates();
				/*
				if(_topLeftCornerCropCoordinateX && _topLeftCornerCropCoordinateY) {
					console.log('loaded topLeftCornerCropCoordinates');
					topLeftCornerCoordinateRef.current = {
						x: _topLeftCornerCropCoordinateX.value as number,
						y: _topLeftCornerCropCoordinateY.value as number
					};
				}
				if(_topRightCornerCropCoordinateX && _topRightCornerCropCoordinateY) {
					console.log('loaded topRightCornerCropCoordinates');
					topRightCornerCoordinateRef.current = {
						x: _topRightCornerCropCoordinateX.value as number,
						y: _topRightCornerCropCoordinateY.value as number
					};
				}
				if(_bottomRightCornerCropCoordinateX && _bottomRightCornerCropCoordinateY) {
					console.log('loaded bottomRightCornerCropCoordinates');
					bottomRightCornerCoordinateRef.current = {
						x: _bottomRightCornerCropCoordinateX.value as number,
						y: _bottomRightCornerCropCoordinateY.value as number
					};
				}
				if(_bottomLeftCornerCropCoordinateX && _bottomLeftCornerCropCoordinateY) {
					console.log('loaded bottomLeftCornerCropCoordinates');
					bottomLeftCornerCoordinateRef.current = {
						x: _bottomLeftCornerCropCoordinateX.value as number,
						y: _bottomLeftCornerCropCoordinateY.value as number
					};
				}*/
				if(_scaleWidthSetting) {
					scaleWidthSettingRef.current = parseFloat(_scaleWidthSetting.value as string);
				}
				if(_scaleHeightSetting) {
					scaleHeightSettingRef.current = parseFloat(_scaleHeightSetting.value as string);
				}
				/*
				entries = _entries;
				chosenEntryIdForAdjustments = _chosenEntryIdForAdjustments;
				scaleWidthSetting = _scaleWidthSetting;
				scaleHeightSetting = _scaleHeightSetting;
				currentEntry = _currentEntry;
				*/
				//setIsLoaded(true);
				console.groupEnd();
				console.log(`coordinatesFromDb=${JSON.stringify(originalCoordinatesFromDbRef.current)}`);
				console.log(`sortedEntries=${JSON.stringify(sortedEntriesRef.current.map( (entry) => {
					return { 
						id: entry.id, 
						date: entry.date, 
						weight: entry.weight
					}
				}))}`);
				console.log(`scaleWidth=${scaleWidthSettingRef.current} scaleHeight=${scaleHeightSettingRef.current}`);
				setTotalEntries(sortedEntriesRef.current.length);
				setLoadedData(true);
			});
		//});
	}, []);

	const processEntry = (entryToProcess:Entry):Promise<number> => {
		console.log('processEntry() called');
		return new Promise( (resolve, reject) => {
			if(!entryToProcess || !entryToProcess.image) {
				reject();
			}
			console.log(`start processing entry with id = ${entryToProcess.id}`);
			let baseImage = new Image();
			baseImage.onload = () => {
				//create cropped image
				let scaledImageCanvas = document.createElement('canvas');
				scaledImageCanvas.width = scaleWidthSettingRef.current;
				scaledImageCanvas.height = scaleHeightSettingRef.current; 
				let scaledImageCanvasContext = scaledImageCanvas.getContext('2d');
				if(scaledImageCanvasContext) {
					console.log(`scale image width=${scaleWidthSettingRef.current} height =${scaleHeightSettingRef.current}`);
					scaledImageCanvasContext.drawImage(
						baseImage, 
						0, 
						0, 
						scaleWidthSettingRef.current, 
						scaleHeightSettingRef.current
					);
//					let scaledImage = new Image();
//					scaledImage.onload = () => {
//						console.log('scaled image loaded');
						//calculate cropped image dimensions
						const croppedImageWidth = originalCoordinatesFromDbRef.current[2].value - originalCoordinatesFromDbRef.current[0].value;
						const croppedImageHeight = originalCoordinatesFromDbRef.current[7].value - originalCoordinatesFromDbRef.current[1].value;
						////originalCoordinatesFromDbRef
						//create cropped image
						let croppedImageCanvas = document.createElement('canvas');
						croppedImageCanvas.width = croppedImageWidth;
						croppedImageCanvas.height = croppedImageHeight;
						console.log(`croppedImageCanvas.width = ${croppedImageWidth}, croppedImageCanvas.height = ${croppedImageHeight}`);
						let croppedImageCanvasContext = croppedImageCanvas.getContext('2d');
						if(croppedImageCanvasContext && entryToProcess.id) {
							console.log('drawImage to croppedImageCanvasContxt');
							croppedImageCanvasContext.drawImage(
								scaledImageCanvas,
								originalCoordinatesFromDbRef.current[0].value,
								originalCoordinatesFromDbRef.current[1].value,
								croppedImageWidth,
								croppedImageHeight,
								0,
								0,
								croppedImageWidth,
								croppedImageHeight
							);
							db.entries.update(entryToProcess.id, {
								alignedImage: croppedImageCanvas.toDataURL()
							}).then( () => {
								console.log('processed entry! id=', entryToProcess.id);
								setEntriesProcessed( cs => cs+1);
								resolve(0);
							});
						}
//					};
//					scaledImage.src = scaledImageCanvas.toDataURL();
				}
			};
			if(entryToProcess.image) {
				baseImage.src = entryToProcess.image;
			}
		});
	};

  const handleProcessEntries = () => {
		if(processingState !== 'unstarted') {
			return;
		}
		setProcessingState('started');
		let entriesToProcess:Promise<number>[] = [];
		sortedEntriesRef.current.forEach( entry => {
			entriesToProcess.push(processEntry(entry));
		});

		Promise.all(entriesToProcess).then( () => {
			setProcessingState('complete');
			console.log('all entries have been processed');
			db.entries.orderBy('date').reverse().toArray().then( (_entries) => {
				//setEntries(sortedEntriesRef.current);
				setEntries(_entries);
			});
		});

		//setEntriesProcessed( cs => cs+1);
	};

return (
    <div>
    	<h2>Viewer ( id = {globalState.currentEntryId} )</h2>
			{ !loadedData && <div>
				<h1>LOADING...</h1>
			</div> }
			
			{ loadedData && <div>
				<h1>Process Entries</h1>
				<button
					type="button"
					onClick={handleProcessEntries}
				>
					Process Entries
				</button>
				<p>
					{entriesProcessed} entries processed out of {totalEntries} total entries.
				</p>
				<p>
					Processing: {processingState}
				</p>
				<hr/>
				<h2>Processed Entries</h2>
				{ entries.length == 0 && <p>none yet</p> }
				<ol>
				{
					entries.map( entry =>
						<li key={entry.id}>
							<span>{entry.id}</span>
							<img src={entry.image} style={{maxWidth: "6rem"}} />
							{'==>'}
							<img src={entry.alignedImage} style={{maxWidth: "6rem"}} />
						</li>
					)
				}
				</ol>
			</div>}
			
		</div>
  );
}

export default Viewer;
