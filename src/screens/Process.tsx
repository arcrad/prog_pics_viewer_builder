import React, { useState, useRef, useEffect, Dispatch, SetStateAction } from 'react';
import  * as mathjs  from 'mathjs';
//import { OffscreenCanvas } from '@types/offscreencanvas';

import { LoadingIndicator } from '../Common';
import { db, Entry, Setting } from '../db';
import { GlobalState } from '../App';
import EntriesValidator,  { ValidationResults } from '../components/EntriesValidator';

const processingStateMap:{[key:string]:string} = {
	'unstarted': 'Not Started',
	'started': 'Started',
	'complete': 'Complete'
}

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
	let [entriesWithAlignedImageCount, setEntriesWithAlignedImageCount] = useState(0);
	//let [cancelProcessingRequested, setCancelProcessingRequested] = useState(false);
	let [validationResults, setValidationResults] = useState<ValidationResults>({});

	const initializedRef = useRef(false);
	const originalCoordinatesFromDbRef = useRef<any[]>([]);
	const scaleWidthSettingRef = useRef(0);
	const scaleHeightSettingRef = useRef(0);
	const sortedEntriesRef = useRef<Entry[]>([]);
	const chosenEntryIdForAdjustmentsSettingRef = useRef<Setting | null>(null);
	const chosenEntryRef = useRef<Entry | null>(null);

	const checkAllEntriesHaveAlignedImage = (_entries:Entry[]) => {
		let entriesWithAlignedImageCount:number = 0;
		const allEntriesHaveAlignedImage:boolean = _entries.reduce( (accumulator, entry) => {
			console.log('checking entries for aligned image');
			if(!entry.alignedImageBlob) {
				console.log('entry doesnt have aligned image');
				accumulator = false;
			} else {
				entriesWithAlignedImageCount++;
			}
			return accumulator;
		}, true as boolean);
		return [allEntriesHaveAlignedImage, entriesWithAlignedImageCount]; 
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
			if(!_chosenEntryIdForAdjustments) {
				console.log(`_chosenEntryIdForAdjustments = ${_chosenEntryIdForAdjustments}`);
				console.warn('No entry is selected as a base for adjustments.')
				return;
			}
			Promise.all([
				db.settings.get('topLeftCornerCropCoordinateX'),
				db.settings.get('topLeftCornerCropCoordinateY'),
				db.settings.get('topRightCornerCropCoordinateX'),
				db.settings.get('topRightCornerCropCoordinateY'),
				db.settings.get('bottomRightCornerCropCoordinateX'),
				db.settings.get('bottomRightCornerCropCoordinateY'),
				db.settings.get('bottomLeftCornerCropCoordinateX'),
				db.settings.get('bottomLeftCornerCropCoordinateY'),
  			db.entries.where('isDraft').equals(0).reverse().sortBy('date'),
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
				//console.dir(coordinates);
				if(_sortedEntries) {
					sortedEntriesRef.current = _sortedEntries;
					const [_allEntriesHaveAlignedImage, _entriesWithAlignedImageCount] = checkAllEntriesHaveAlignedImage(_sortedEntries);
					setAllEntriesHaveAlignedImage(_allEntriesHaveAlignedImage as boolean);
					console.log(`_allEntriesHaveAlignedImage = ${_allEntriesHaveAlignedImage}`);
					setEntries(_sortedEntries);
					setEntriesWithAlignedImageCount(_entriesWithAlignedImageCount as number);
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
			}).catch( error => {
				console.error(error);
			});
		}).catch( error => {
			console.error(error)
		});;
	}, []);

	function processEntry(
		entryToProcess:Entry, 
		chosenEntryImageNaturalWidth:number, 
		chosenEntryImageNaturalHeight:number
	):Promise<number> {
		console.log('processEntry() called');
		return new Promise( (resolve, reject) => {
			if(!entryToProcess || !entryToProcess.imageBlob) {
				reject();
			}
			//console.log(`start processing entry with id = ${entryToProcess.id}`);
			let baseImage:HTMLImageElement|null = new Image();
			//baseImage = new Image();
			baseImage.onload = async () => {
				if(!baseImage) {
					reject(0);
					return; //to satisfy typescript
				}
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
				const transformMatrix = mathjs.multiply(destinationMatrix, invertedSourceMatrix);	
				//console.dir(transformMatrix);
				//console.dir([...transformMatrix[0],...transformMatrix[1]]);
				let warpedImageCanvas:OffscreenCanvas = new OffscreenCanvas(chosenEntryImageNaturalWidth, chosenEntryImageNaturalHeight);
				//warpedImageCanvas.width = chosenEntryImageNaturalWidth;
				//warpedImageCanvas.height = chosenEntryImageNaturalHeight;
				let warpedImageCanvasContext = warpedImageCanvas.getContext('2d', {alpha: false});
				if(warpedImageCanvasContext) {
					warpedImageCanvasContext.setTransform(
						transformMatrix[0][0],
						transformMatrix[1][0],
						transformMatrix[0][1],
						transformMatrix[1][1],
						transformMatrix[0][2],
						transformMatrix[1][2]
					);
					warpedImageCanvasContext.drawImage(
						baseImage, 
						0, 
						0, 
						baseImage.naturalWidth, 
						baseImage.naturalHeight
					);
				}
				//hint GC
				baseImage = null;
				//scale baseImage
				let scaledImageCanvas:OffscreenCanvas = new OffscreenCanvas(scaleWidthSettingRef.current, scaleHeightSettingRef.current);
				let scaledImageCanvasContext = scaledImageCanvas.getContext('2d', {alpha: false});
				if(scaledImageCanvasContext) {
					//console.log(`scale image width=${scaleWidthSettingRef.current} height =${scaleHeightSettingRef.current}`);
					scaledImageCanvasContext.drawImage(
						warpedImageCanvas, 
						0, 
						0, 
						scaleWidthSettingRef.current, 
						scaleHeightSettingRef.current
					);
				}
				//hint GC 
				warpedImageCanvas = null;
				warpedImageCanvasContext = null;
				//create cropped image
				//calculate cropped image dimensions
				const croppedImageWidth = originalCoordinatesFromDbRef.current[2].value - originalCoordinatesFromDbRef.current[0].value;
				const croppedImageHeight = originalCoordinatesFromDbRef.current[7].value - originalCoordinatesFromDbRef.current[1].value;
				let croppedImageCanvas:HTMLCanvasElement|null = document.createElement('canvas');
        croppedImageCanvas.width = croppedImageWidth;
        croppedImageCanvas.height = croppedImageHeight;
				//console.log(`croppedImageCanvas.width = ${croppedImageWidth}, croppedImageCanvas.height = ${croppedImageHeight}`);
				let croppedImageCanvasContext = croppedImageCanvas.getContext('2d', {alpha: false});
				if(croppedImageCanvasContext) {
					//console.log('drawImage to croppedImageCanvasContext');
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
				//hint GC
				scaledImageCanvas = null;
				scaledImageCanvasContext = null;
			  //save final processed image to db	
				croppedImageCanvas.toBlob( async (blob) => {
					if(entryToProcess.id) {
						db.entries.update(entryToProcess.id, {
							alignedImageBlob: new Uint8Array(await blob.arrayBuffer())
						}).then( () => {
							if(baseImage && baseImage.src) {
								URL.revokeObjectURL(baseImage.src);
							}
							//hint GC	
							croppedImageCanvas = null;
							croppedImageCanvasContext = null;
							blob = null;
							//increment progress counter
							setEntriesProcessed( cs => cs+1);
							//console.log('processed entry! id=', entryToProcess.id);
							resolve(0);
						});
					}
				}, 'image/jpeg', 0.9);
			};
			if(entryToProcess.imageBlob) {
				baseImage.src = URL.createObjectURL(new Blob([entryToProcess.imageBlob.buffer]));
			}
		});
	};

  function handleProcessAllEntries() {
		if(!(processingState === 'unstarted' || processingState === 'complete')) {
			return;
		}
		setProcessingState('started');
		setEntriesProcessed(0);
		let chosenEntryImage = new Image();
		chosenEntryImage.onload = async () => {
			for(let c = 0, max = sortedEntriesRef.current.length; c < max; c++) {
				await processEntry(sortedEntriesRef.current[c], chosenEntryImage.naturalWidth, chosenEntryImage.naturalHeight);
			}
			setProcessingState('complete');
			console.log('all entries have been processed');
  		db.entries
				.where('isDraft')
				.equals(0)
				.reverse()
				.sortBy('date')
				.then( (_entries) => {
					const [_allEntriesHaveAlignedImage, _entriesWithAlignedImageCount] = checkAllEntriesHaveAlignedImage(_entries);
					setAllEntriesHaveAlignedImage(_allEntriesHaveAlignedImage as boolean);
					setEntriesWithAlignedImageCount(_entriesWithAlignedImageCount as number);
					setEntries(_entries);
			});	
		}	
		if(chosenEntryRef.current && chosenEntryRef.current.imageBlob) {
			chosenEntryImage.src = URL.createObjectURL(new Blob([chosenEntryRef.current.imageBlob.buffer]));
		}
	};

	function handleProcessUnprocessedEntries() {
		if(!(processingState === 'unstarted' || processingState === 'complete')) {
			return;
		}
		setProcessingState('started');
		//filter entries to just the ones without an aligned image
		const entriesWithoutAlignedImage = sortedEntriesRef.current.filter( (entry) => {
			return !entry.alignedImageBlob;
		});
		console.log('entriesWithoutAlignedImage = ');
		console.dir(entriesWithoutAlignedImage);
		let chosenEntryImage = new Image();
		chosenEntryImage.onload = async () => {
			for(let c = 0, max = entriesWithoutAlignedImage.length; c < max; c++) {
				await processEntry(entriesWithoutAlignedImage[c], chosenEntryImage.naturalWidth, chosenEntryImage.naturalHeight);
			}
			setProcessingState('complete');
			console.log('all unprocessed entries have been processed');
  		db.entries
				.where('isDraft')
				.equals(0)
				.reverse()
				.sortBy('date')
				.then( (_entries) => {
					const [_allEntriesHaveAlignedImage, _entriesWithAlignedImageCount] = checkAllEntriesHaveAlignedImage(_entries);
					setAllEntriesHaveAlignedImage(_allEntriesHaveAlignedImage as boolean);
					setEntriesWithAlignedImageCount(_entriesWithAlignedImageCount as number);
					setEntries(_entries);
			});	
		}	
		if(chosenEntryRef.current && chosenEntryRef.current.imageBlob) {
		//	chosenEntryImage.src = URL.createObjectURL(chosenEntryRef.current.imageBlob);
			chosenEntryImage.src = URL.createObjectURL(new Blob([chosenEntryRef.current.imageBlob.buffer]));
		}
	};
	
	let currentImage = '';
	const blob = entries[currentEntry]?.alignedImageBlob;
	if(blob) {
		currentImage = URL.createObjectURL(new Blob([blob.buffer]));
	}

	const allRelevantValidationsPassed = 
		validationResults.moreThanZeroEntries
		&& validationResults.allEntriesHaveImageBlob
		&& validationResults.allEntriesHaveAllMarks
		&& validationResults.adjustmentImageCropAndScalingChosen
		&& validationResults.adjustmentImageCropAndScalingIsValid;
	
	return (
		<>
		<div className="columns is-mobile is-centered">
			<div className="column is-12">
				<div className="hero is-small is-primary">
					<div className="hero-body">
    				<h2 className="title">Process Entries</h2>
						<p className="subtitle">Generate scaled, cropped, and aligned images from base images.</p>
					</div>
				</div>
			</div>
			</div>
			<div className="columns is-mobile is-centered">
				<div className="column is-10-mobile is-8-tablet is-4-desktop">
			<EntriesValidator
				validationResults={validationResults}
				setValidationResults={setValidationResults}
				showOnlyErrors={true}
				displayOnlyTheseValidations={[
					'moreThanZeroEntries',
					'allEntriesHaveImageBlob',
					'allEntriesHaveAllMarks',
					'adjustmentImageCropAndScalingChosen',
					'adjustmentImageCropAndScalingIsValid'
				]}
			/>
				</div>
			</div>
		<div className="columns is-mobile is-centered">
			<div className="column is-11-mobile is-10-tablet is-8-desktop">
			{
				Object.keys(validationResults).length > 0 &&
				!allRelevantValidationsPassed &&
				<div className="message is-danger">
					<div className="message-body">
						<p>There are validation errors that must be fixed before processing can occur.</p>
					</div>
				</div>
				
			}
			{
					!Object.keys(validationResults).length > 0
					&& !loadedData
				&&
				<LoadingIndicator/>
			}
			{ 
				allRelevantValidationsPassed &&
				loadedData && 
				<div>
					<div className="box">
					<div className="field is-grouped is-flex-direction-column-mobile">
						<div className="control">
							<button
								type="button"
								className="button is-primary"
								onClick={handleProcessAllEntries}
							>
								Process All Entries
							</button>
						</div>
						<div className="control">
							<button
								type="button"
								className="button mt-2-mobile"
								onClick={handleProcessUnprocessedEntries}
								disabled={ entriesWithAlignedImageCount === totalEntries ? true : false}
							>
								Process Only Unprocessed Entries
							</button>
						</div>
					</div>
					<div className="block">
					<p className="is-size-4">
						Processing Status: { processingStateMap[processingState] }
					</p>
					</div>
					<div className="block">
					<div className="field">
						<div className="label">
							<label>
								{entriesProcessed} entries processed out of {totalEntries} total entries.
							</label>
						</div>
						<div className="control">
						<progress 
							max={totalEntries} 
							value={entriesProcessed}
							className="progress is-info"
						>
							{entriesProcessed} entries processed out of {totalEntries} total entries.
						</progress>
						</div>
						<div className="help">
							<p>
							</p>
						</div>
					</div>
					</div>
					<div className="block">
					<h2 className="title is-5">Processed Entries Preview</h2>
					<p>
						{entriesWithAlignedImageCount} of {totalEntries} entries have an aligned image.
					</p>
					<p>
						Do all entries have an aligned image?  
						{allEntriesHaveAlignedImage ? ' Yes' : <> No (Click <b>Process ... Entries</b> button)</>}
					</p>
					{ entries.length === 0 && <p>Currently no processed images...</p> }
					</div>
					{
						allEntriesHaveAlignedImage && 
						<div className="block">
							<img
								src={currentImage}
								alt="Current processed entry"
								style={{maxWidth: '50vw', maxHeight: '75vh'}}
							/>
							<p className="mb-2">{(new Date(entries[currentEntry].date)).toLocaleString()} ( ID: {entries[currentEntry].id} )</p>
							<div className="field has-addons">
								<div className="control">
									<button 
										type="button" 
										className="button"
										onClick={ () => {
											setCurrentEntry( (cs) => cs > 0 ? cs-1 : entries.length-1)
										}}
									>
										Previous
									</button>
								</div>
								<div className="control">
									<button
										type="button" 
										className="button"
										onClick={() => {
											setCurrentEntry( (cs) => cs < entries.length-1 ? cs+1 : 0)
										}}
									>
										Next
									</button>
								</div>
							</div>
						</div>
					}
					</div>
				</div>
			}			
		</div>
		</div>
		</>
  );
}

export default Viewer;
