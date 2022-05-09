import React, { useState, useRef, useEffect, Dispatch, SetStateAction } from 'react';
import  * as mathjs  from 'mathjs';
//importi './Viewer.css';
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
	let [currentEntry, setCurrentEntry] = useState(0);
	let [allEntriesHaveAlignedImage, setAllEntriesHaveAlignedImage] = useState(false);
	
	const initializedRef = useRef(false);
	const originalCoordinatesFromDbRef = useRef<any[]>([]);
	const scaleWidthSettingRef = useRef(0);
	const scaleHeightSettingRef = useRef(0);
	const sortedEntriesRef = useRef<Entry[]>([]);
	const chosenEntryIdForAdjustmentsSettingRef = useRef<Setting | null>(null);
	const chosenEntryRef = useRef<Entry | null>(null);

	const checkAllEntriesHaveAlignedImage = (_entries:Entry[]) => {
		return _entries.reduce( (accumulator, entry) => {
			console.log('checking entries for alignedimage');
			if(!entry.alignedImageBlob) {
				console.log('entry doesnt have aligned image');
				accumulator = false;
			} 
			return accumulator;
		}, true);
	};

	useEffect( () => {
		//fetch all initial data and then set intializedData flag 	
		console.warn('INITIALIZER FIRED!');
		if(initializedRef.current) {
				console.log('already initialized, aborting');
				return;
		}
		console.log('fetch all initial data and then set loadedData flag');
		initializedRef.current = true;
		db.settings.get('chosenEntryIdForAdjustments').then((_chosenEntryIdForAdjustments) => {
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
				db.entries.get( parseInt(_chosenEntryIdForAdjustments?.value as string) )
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
				_chosenEntry
			]) => {
				console.group('got data from db'); 
				//console.log('got data from db'); 
				//console.dir(coordinates);
				//	originalCoordinatesFromDbRef.current = coordinates;
				if(_sortedEntries) {
					sortedEntriesRef.current = _sortedEntries;
					let _allEntriesHaveAlignedImage = checkAllEntriesHaveAlignedImage(_sortedEntries);
					setAllEntriesHaveAlignedImage(_allEntriesHaveAlignedImage);
					if(_allEntriesHaveAlignedImage) {
						console.log(`_allEntriesHaveAlignedImage = ${_allEntriesHaveAlignedImage}`);
						setEntries(_sortedEntries);
					}
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
				if(_scaleWidthSetting) {
					scaleWidthSettingRef.current = parseFloat(_scaleWidthSetting.value as string);
				}
				if(_scaleHeightSetting) {
					scaleHeightSettingRef.current = parseFloat(_scaleHeightSetting.value as string);
				}
				if(_chosenEntryIdForAdjustments) {
					chosenEntryIdForAdjustmentsSettingRef.current = _chosenEntryIdForAdjustments;
				}
				if(_chosenEntry) {
					chosenEntryRef.current = _chosenEntry;
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
		});
	}, []);

	const processEntry = (entryToProcess:Entry, chosenEntryImageNaturalWidth:number, chosenEntryImageNaturalHeight:number):Promise<number> => {
		console.log('processEntry() called');
		return new Promise( (resolve, reject) => {
			if(!entryToProcess || !entryToProcess.imageBlob) {
				reject();
			}
			console.log(`start processing entry with id = ${entryToProcess.id}`);
			let baseImage = new Image();
			baseImage.onload = async () => {
				//log marks
				//console.log('marks =', entryToProcess.marks);
				//console.log('mark A = ', entryToProcess.marks?.A);
				//console.log('dest marks = ', sortedEntriesRef.current[0].marks);
				//create reference point matrices
				//do affine transformation
				const invertedSourceMatrix = mathjs.inv([
					[
						entryToProcess.marks?.A.x || 0, 
						entryToProcess.marks?.B.x || 0, 
						entryToProcess.marks?.C.x || 0
					],
					[
						entryToProcess.marks?.A.y || 0, 
						entryToProcess.marks?.B.y || 0, 
						entryToProcess.marks?.C.y || 0
					],
					[
						1, 
						1, 
						1
					]
				]);
				const destinationMatrix = [
					[
						chosenEntryRef.current?.marks?.A.x || 0, 
						chosenEntryRef.current?.marks?.B.x || 0, 
						chosenEntryRef.current?.marks?.C.x || 0
					],
					[
						chosenEntryRef.current?.marks?.A.y || 0, 
						chosenEntryRef.current?.marks?.B.y || 0, 
						chosenEntryRef.current?.marks?.C.y || 0
					]
				];
				const xformMatrix = mathjs.multiply(destinationMatrix, invertedSourceMatrix);	
				//console.dir(xformMatrix);
				//console.dir([...xformMatrix[0],...xformMatrix[1]]);
				let warpedImageCanvas = document.createElement('canvas');
				warpedImageCanvas.width = chosenEntryImageNaturalWidth;
				warpedImageCanvas.height = chosenEntryImageNaturalHeight;
				let warpedImageCanvasContext = warpedImageCanvas.getContext('2d');
				if(warpedImageCanvasContext) {
					warpedImageCanvasContext.setTransform(
						xformMatrix[0][0],
						xformMatrix[1][0],
						xformMatrix[0][1],
						xformMatrix[1][1],
						xformMatrix[0][2],
						xformMatrix[1][2]
					);
					warpedImageCanvasContext.drawImage(
						baseImage, 
						0, 
						0, 
						baseImage.naturalWidth, 
						baseImage.naturalHeight
					);
				}
				//scale baseImage
				let scaledImageCanvas = document.createElement('canvas');
				scaledImageCanvas.width = scaleWidthSettingRef.current;
				scaledImageCanvas.height = scaleHeightSettingRef.current; 
				let scaledImageCanvasContext = scaledImageCanvas.getContext('2d');
				if(scaledImageCanvasContext) {
					console.log(`scale image width=${scaleWidthSettingRef.current} height =${scaleHeightSettingRef.current}`);
					scaledImageCanvasContext.drawImage(
						warpedImageCanvas, 
						0, 
						0, 
						scaleWidthSettingRef.current, 
						scaleHeightSettingRef.current
					);
				}
				//calculate cropped image dimensions
				const croppedImageWidth = originalCoordinatesFromDbRef.current[2].value - originalCoordinatesFromDbRef.current[0].value;
				const croppedImageHeight = originalCoordinatesFromDbRef.current[7].value - originalCoordinatesFromDbRef.current[1].value;
				//create cropped image
				let croppedImageCanvas = document.createElement('canvas');
				croppedImageCanvas.width = croppedImageWidth;
				croppedImageCanvas.height = croppedImageHeight;
				console.log(`croppedImageCanvas.width = ${croppedImageWidth}, croppedImageCanvas.height = ${croppedImageHeight}`);
				let croppedImageCanvasContext = croppedImageCanvas.getContext('2d');
				if(croppedImageCanvasContext) {
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
				}
				croppedImageCanvas.toBlob( (blob) => {
					if(entryToProcess.id) {
						db.entries.update(entryToProcess.id, {
							alignedImageBlob: blob
						}).then( () => {
							console.log('processed entry! id=', entryToProcess.id);
							setEntriesProcessed( cs => cs+1);
							resolve(0);
						});
					}
				});
			};
			if(entryToProcess.imageBlob) {
				//baseImage.src = entryToProcess.image;
				baseImage.src = URL.createObjectURL(entryToProcess.imageBlob);
			}
		});
	};

  const handleProcessEntries = () => {
		if(processingState !== 'unstarted') {
			return;
		}
		setProcessingState('started');
		let chosenEntryImage = new Image();
		chosenEntryImage.onload = () => {
			let entriesToProcess:Promise<number>[] = [];
			sortedEntriesRef.current.forEach( entry => {
				entriesToProcess.push(processEntry(entry, chosenEntryImage.naturalWidth, chosenEntryImage.naturalHeight));
				//entriesToProcess.push(processEntry(entry));
			});
	
			Promise.all(entriesToProcess).then( () => {
				setProcessingState('complete');
				console.log('all entries have been processed');
				db.entries.orderBy('date').reverse().toArray().then( (_entries) => {
					let _allEntriesHaveAlignedImage = checkAllEntriesHaveAlignedImage(_entries);
					setAllEntriesHaveAlignedImage(_allEntriesHaveAlignedImage);
					//setEntries(sortedEntriesRef.current);
					setEntries(_entries);
				});
			});
		}
		
		if(chosenEntryRef.current && chosenEntryRef.current.imageBlob) {
			//chosenEntryImage.src = chosenEntryRef.current.image;
			chosenEntryImage.src = URL.createObjectURL(chosenEntryRef.current.imageBlob);
		}
		//setEntriesProcessed( cs => cs+1);
	};

	let currentImage = '';
//	if(entries && entries[currentEntry] && entries[currentEntry].alignedImageBlob) {
		const blob = entries[currentEntry]?.alignedImageBlob;
		if(blob) {
		currentImage = URL.createObjectURL(blob);
		}
//	}

	return (
    <div>
    	<h2>Viewer ( id = {globalState.currentEntryId} )</h2>
			{ !loadedData && <div>
				<h1>LOADING...</h1>
			</div> }
			
			{ loadedData && <div>
				<h1>Process Entries?</h1>
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
				<p>
					Do all entries have an aligned image?  
					{allEntriesHaveAlignedImage ? ' Yes' : <> No (Click <b>Process Entries</b> button)</>}
				</p>
				{ entries.length == 0 && <p>Currently no processed images...</p> }
				{/*
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
				*/}
				<img src={currentImage} style={{maxWidth: '50rem', maxHeight: '75vh'}}/>
				<div>
					<button type="button" onClick={ () => {
						setCurrentEntry( (cs) => cs > 0 ? cs-1 : entries.length-1)
					}}>Prev</button>
					<button type="button" onClick={() => {
						setCurrentEntry( (cs) => cs < entries.length-1 ? cs+1 : 0)
					}}>Next</button>
				</div>
			</div>}
			
		</div>
  );
}

export default Viewer;
