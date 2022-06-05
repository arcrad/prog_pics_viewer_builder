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

import { db, Entry, Setting } from './db';
import { GlobalState  } from './App';
import EntriesValidator,  { ValidationResults, defaultValidationResults } from './EntriesValidator';

import styles from './Adjust.module.css';

type AdjustAttributes = {
	globalState: GlobalState;
	setGlobalState: Dispatch<SetStateAction<GlobalState>>;
}

type Coordinate = {
	x: number,
	y: number
}

function Adjust({
	globalState,
	setGlobalState
}:AdjustAttributes) {
	let [loadedInitialData, setLoadedInitialData] = useState(false);
	let [cropAdjustActive, setCropAdjustActive] = useState(false);
	let [currentSelectValue, setCurrentSelectValue] = useState(-1);
	let [scaleWidth, setScaleWidth] = useState('0');
	let [scaleHeight, setScaleHeight] = useState('0');
	let [resizeCanary, setResizeCanary] = useState(0);
	let [renderTrigger, setRenderTrigger] = useState(Date.now());
	let [cropCornerCoordinatesInitialized, setCropCornerCoordinatesInitialized] = useState(false);
	let [scaledImageData, setScaledImageData] = useState<Blob | null>(null);
	let [scaledImageDataUrl, setScaledImageDataUrl] = useState<string>('');
	let [validationResults, setValidationResults] = useState<ValidationResults>(defaultValidationResults);

	let topLeftCornerCoordinateRef
		= useRef<Coordinate>({// x: 25, y: 25});
				x: globalState.settings.topLeftCornerCropCoordinateX as number,
				y: globalState.settings.topLeftCornerCropCoordinateY as number
			});
	let topRightCornerCoordinateRef
		= useRef<Coordinate>({// x: 0, y:0});
				x: globalState.settings.topRightCornerCropCoordinateX as number,
				y: globalState.settings.topRightCornerCropCoordinateY as number
			});
	let bottomRightCornerCoordinateRef
		= useRef<Coordinate>({// x: 0, y:0});
				x: globalState.settings.bottomRightCornerCropCoordinateX as number,
				y: globalState.settings.bottomRightCornerCropCoordinateY as number
			});
	let bottomLeftCornerCoordinateRef
		= useRef<Coordinate>({// x: 0, y:0});
				x: globalState.settings.bottomLeftCornerCropCoordinateX as number,
				y: globalState.settings.bottomLeftCornerCropCoordinateY as number
			});
	
	let imageTopLeftCoordinateRef
		= useRef<Coordinate>({ x: 0, y: 0});
	let imageTopRightCoordinateRef
		= useRef<Coordinate>({ x: 0, y: 0});
	let imageBottomRightCoordinateRef
		= useRef<Coordinate>({ x: 0, y: 0});
	let imageBottomLeftCoordinateRef
		= useRef<Coordinate>({ x: 0, y: 0});

	const initialized = useRef<boolean>(false);
	const loadingIndicatorRef = useRef<HTMLDivElement>(null);

	const needToResetCornerCoordinatesRef = useRef<boolean>(false);

	const originalCoordinatesFromDbRef = useRef<any[]>([]);
	const activeCornerControlRef = useRef('none');

	const currentCropImageContainerRef = useRef<HTMLImageElement>(null);
	const currentCropImageRef = useRef<HTMLImageElement>(null);

	const topLeftCornerControl = useRef<HTMLDivElement>(null);	
	const topRightCornerControl = useRef<HTMLDivElement>(null);	
	const bottomRightCornerControl = useRef<HTMLDivElement>(null);	
	const bottomLeftCornerControl = useRef<HTMLDivElement>(null);	
	const imageSelectRef = useRef<HTMLSelectElement>(null);
	///////





	///////
	/*
	useEffect( () => {
		if(needToResetCornerCoordinatesRef.current) {
			console.warn('do reset corner coordinates');
			activeCornerControlRef.current = 'all';
			updateAdjustmentImageCornerCoordinates();
			setCropCoordinatesToImageCorners();
			needToResetCornerCoordinatesRef.current = false;
		}	
	});
	*/
	const updateScaledCornerCropCoordinates = () => {
		console.group('updateScaledCornerCropCoordinates() called');
		let xScaleFactor = 1;
		let yScaleFactor = 1;
		if(currentCropImageContainerRef.current && currentCropImageRef.current) {	
			xScaleFactor = 
				(currentCropImageRef.current.naturalWidth / currentCropImageRef.current.clientWidth) || 1;
			yScaleFactor = 
				(currentCropImageRef.current.naturalHeight / currentCropImageRef.current.clientHeight) || 1;
		}
		console.log(`xScaleFactor = ${xScaleFactor}, yScaleFactor = ${yScaleFactor}`);
		const coordinates = originalCoordinatesFromDbRef.current;
		if( coordinates[0]?.value != null && coordinates[1]?.value != null) {
			const newCoord = {
				x: (coordinates[0].value as number / xScaleFactor) || 0,
				y: (coordinates[1].value as number / yScaleFactor) || 0
			};
			console.log(`new top left coord = ${JSON.stringify(newCoord)}`);
			topLeftCornerCoordinateRef.current = newCoord;
			//setRenderTrigger(Date.now());
		}
		if( coordinates[2]?.value != null && coordinates[3]?.value != null) {
			const newCoord ={
				x: (coordinates[2].value as number / xScaleFactor) || 0,
				y: (coordinates[3].value as number / yScaleFactor) || 0
			};
			console.log(`new top right coord = ${JSON.stringify(newCoord)}`);
			topRightCornerCoordinateRef.current = newCoord;
			//setRenderTrigger(Date.now());
		}
		if( coordinates[4]?.value != null && coordinates[5]?.value != null) {
			const newCoord = {
				x: (coordinates[4].value as number / xScaleFactor) || 0,
				y: (coordinates[5].value as number / yScaleFactor) || 0 
			};
			console.log(`new bottom right coord = ${JSON.stringify(newCoord)}`);
			bottomRightCornerCoordinateRef.current = newCoord;
			//setRenderTrigger(Date.now());
		}
		if( coordinates[6]?.value != null && coordinates[7]?.value != null) {
			const newCoord = {
				x: (coordinates[6].value as number / xScaleFactor) || 0,
				y: (coordinates[7].value as number / yScaleFactor) || 0
			};
			console.log(`new bottom left coord = ${JSON.stringify(newCoord)}`);
			bottomLeftCornerCoordinateRef.current = newCoord;
			//setRenderTrigger(Date.now());
		}
			setRenderTrigger(Date.now());
		setCropCornerCoordinatesInitialized(true);
		console.groupEnd();
	};
	
	const updateAdjustmentImageCornerCoordinates = () => {
		console.group('updateAdjustmentImageCornerCoordinates');
		if(currentCropImageContainerRef.current && currentCropImageRef.current) {	
			//console.log('currentCropImageContainerRef.current = ');
			//console.dir(currentCropImageRef.current);
			const boundingRect = currentCropImageContainerRef.current.getBoundingClientRect();
			console.log(`boundRect.left = ${boundingRect.left}, boundingRect.top = ${boundingRect.top}`);
			imageTopLeftCoordinateRef.current = {
				x: boundingRect.left,
				y: boundingRect.top
			};
			imageTopRightCoordinateRef.current = {
				x: boundingRect.left + currentCropImageRef.current.clientWidth,
				y: boundingRect.top
			};
			imageBottomRightCoordinateRef.current = {
				x: boundingRect.left + currentCropImageRef.current.clientWidth,
				y: boundingRect.top + currentCropImageRef.current.clientHeight
			};
			imageBottomLeftCoordinateRef.current = {
				x: boundingRect.left,
				y: boundingRect.top + currentCropImageRef.current.clientHeight
			};
		}
		console.groupEnd();
	};

	const loadCropCoordinatesFromDb = () => {
		console.log('loadCropCoordinatesFromDb() called');
		return Promise.all([
			db.settings.get('topLeftCornerCropCoordinateX'),
			db.settings.get('topLeftCornerCropCoordinateY'),
			db.settings.get('topRightCornerCropCoordinateX'),
			db.settings.get('topRightCornerCropCoordinateY'),
			db.settings.get('bottomRightCornerCropCoordinateX'),
			db.settings.get('bottomRightCornerCropCoordinateY'),
			db.settings.get('bottomLeftCornerCropCoordinateX'),
			db.settings.get('bottomLeftCornerCropCoordinateY')
		]).then( (coordinates) => { 
			console.log('got corner coords from db'); 
			//console.dir(coordinates);
			originalCoordinatesFromDbRef.current = coordinates;
		});
	};
	
	const setCropCoordinatesToImageCornersInDb = (imageWidth:number, imageHeight:number) => {
		console.log(`setCropCoordinatesToImageCornersInDb() called width=${imageWidth} height=${imageHeight}`);
				return db.settings.bulkPut([
					{ 
						key: "topLeftCornerCropCoordinateX", 
						value: 0 
					},{ 
						key: "topLeftCornerCropCoordinateY", 
						value: 0
					},{ 
						key: "topRightCornerCropCoordinateX", 
						value: imageWidth
					},{ 
						key: "topRightCornerCropCoordinateY", 
						value: 0
					},{ 
						key: "bottomRightCornerCropCoordinateX", 
						value: imageWidth
					},{ 
						key: "bottomRightCornerCropCoordinateY", 
						value: imageHeight
					},{ 
						key: "bottomLeftCornerCropCoordinateX", 
						value: 0
					},{ 
						key: "bottomLeftCornerCropCoordinateY", 
						value: imageHeight
					}
				]);
	};

	const debounceUpdateCoordinatesInDbTimeout = useRef(0);	
	const updateCropCoordinatesInDb = () => {
		window.clearTimeout(debounceUpdateCoordinatesInDbTimeout.current);
		debounceUpdateCoordinatesInDbTimeout.current = window.setTimeout( async () => {
			console.group('updating crop coordinate in DB...');
			let xScaleFactor = 1;
			let yScaleFactor = 1;
			if(currentCropImageContainerRef.current && currentCropImageRef.current) {	
				xScaleFactor = 
					currentCropImageRef.current.naturalWidth / currentCropImageRef.current.clientWidth || 1;
				yScaleFactor = 
					currentCropImageRef.current.naturalHeight / currentCropImageRef.current.clientHeight || 1;
			}
			console.log(`xScaleFactor = ${xScaleFactor}, yScaleFactor = ${yScaleFactor}`);
			try {
				let idsUpdated = [];
				/*
 				console.log(`topLeftCornerCoordinateRef.current.x = ${topLeftCornerCoordinateRef.current.x} * ${xScaleFactor}`);
				console.log(`topRightCornerCoordinateRef.current.x = ${topRightCornerCoordinateRef.current.x} * ${xScaleFactor}`);
				console.log(`bottomRightCornerCoordinateRef.current.x = ${bottomRightCornerCoordinateRef.current.x} * ${xScaleFactor}`);
				console.log(`bottomLeftCornerCoordinateRef.current.x = ${bottomLeftCornerCoordinateRef.current.x} * ${xScaleFactor}`);
				*/
				idsUpdated.push( await db.settings.bulkPut([
					{ 
						key: "topLeftCornerCropCoordinateX", 
						value: topLeftCornerCoordinateRef.current.x * xScaleFactor 
					},{ 
						key: "topLeftCornerCropCoordinateY", 
						value: topLeftCornerCoordinateRef.current.y * yScaleFactor 
					},{ 
						key: "topRightCornerCropCoordinateX", 
						value: topRightCornerCoordinateRef.current.x * xScaleFactor 
					},{ 
						key: "topRightCornerCropCoordinateY", 
						value: topRightCornerCoordinateRef.current.y * yScaleFactor 
					},{ 
						key: "bottomRightCornerCropCoordinateX", 
						value: bottomRightCornerCoordinateRef.current.x * xScaleFactor 
					},{ 
						key: "bottomRightCornerCropCoordinateY", 
						value: bottomRightCornerCoordinateRef.current.y * yScaleFactor 
					},{ 
						key: "bottomLeftCornerCropCoordinateX", 
						value: bottomLeftCornerCoordinateRef.current.x * xScaleFactor 
					},{ 
						key: "bottomLeftCornerCropCoordinateY", 
						value: bottomLeftCornerCoordinateRef.current.y * yScaleFactor
					}
				]));
				console.log(`ids updated = ${idsUpdated.join(', ')}`);
			} catch(error) {
				console.error(`failed to add db entry. ${error}`);
			}
			console.groupEnd();
		}, 200);
	};

	const handleSelectImage = async () => {
		console.group('handleSelectImage() called');
		if(
			imageSelectRef.current
			&& imageSelectRef.current.value
		) {
			if(currentEntry && currentEntry.id == parseInt(imageSelectRef.current.value)) {
				console.error('same image selected');
			} else {
				currentCropImageContainerRef.current?.classList.add(styles.notVisible);
				loadingIndicatorRef.current?.classList.remove(styles.displayNone);
			}
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
			if(newEntry && newEntry.imageBlob) {
				//setIsLoaded(false);
				/*const chosenCropImageDataId = await db.settings.put(
					{ key: "chosenCropImageData", value: newEntry.image }
				);*/
				let image = new Image();
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
						//activeCornerControlRef.current = 'all';
						//updateAdjustmentImageCornerCoordinates();
						//setCropCoordinatesToImageCorners();
						//setRenderTrigger(Date.now());

					} catch(error) {
						console.error(`failed to add db entry. ${error}`);
					}
					let lastIdUpdated = await setCropCoordinatesToImageCornersInDb(image.naturalWidth, image.naturalHeight);
					if(newEntry && newEntry.imageBlob) {
						//setScaledImageData(newEntry.image);
						setScaledImageData(newEntry.imageBlob);
						setScaledImageDataUrl(newEntry.imageBlob ? URL.createObjectURL(newEntry.imageBlob) : '');
					}
					initialized.current = false;
					/*
 					activeCornerControlRef.current = 'all';
					updateAdjustmentImageCornerCoordinates();
					setCropCoordinatesToImageCorners();
					setRenderTrigger(Date.now());
					needToResetCornerCoordinatesRef.current = true;
					*/
				}
				//image.src = newEntry.image;
				image.src = URL.createObjectURL(newEntry.imageBlob);
			}
		}
		console.groupEnd();
	};
		
	const handleAdjustCropping = (event: MouseEvent<HTMLButtonElement>) => {
		setCropAdjustActive( cs => !cs);
	};
	
	let debounceInputTimeout = useRef(0);
	const handleInputChange = async (event:ChangeEvent<HTMLInputElement>) => {
		console.group('handleInputChange() called');
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
								{ key: settingsKeyToModify, value: newValue }, 
							);
							console.log('new id =', id);
						} catch(error) {
							console.error(`failed to add db entry. ${error}`);
						}
			//Promise.all([
				let _scaleWidthSetting = await db.settings.get('scaleWidth');
				let _scaleHeightSetting = await db.settings.get('scaleHeight');
				let _chosenEntryIdForAdjustments = await db.settings.get('chosenEntryIdForAdjustments');
			/*]).then(([
				_scaleWidthSetting,
				_scaleHeightSetting,
				_chosenEntryIdForAdjustments
			]) => {*/
				if(_scaleWidthSetting && _scaleHeightSetting && _chosenEntryIdForAdjustments && _chosenEntryIdForAdjustments.value) {
					await scaleChosenImage(_scaleWidthSetting, _scaleHeightSetting, _chosenEntryIdForAdjustments);
					let lastIdUpdated = await setCropCoordinatesToImageCornersInDb(_scaleWidthSetting.value as number, _scaleHeightSetting.value as number);
				}
			//});
			};


			debounceInputTimeout.current = window.setTimeout( modifyDbValueHandler, 500);
		}
		console.groupEnd();
	};
 
	const entries = useLiveQuery(
		() => db.entries.orderBy('date').filter((entry) => entry.draft !== true).reverse().toArray()
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
			if(chosenEntryIdForAdjustments && chosenEntryIdForAdjustments.value) {
				console.log('setting currentEntry');
				return db.entries.get( parseInt(chosenEntryIdForAdjustments.value as string) );
			}
		}
	, [chosenEntryIdForAdjustments]);

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
				db.settings.get('topLeftCornerCropCoordinateX'),
				db.settings.get('topLeftCornerCropCoordinateY'),
				db.settings.get('topRightCornerCropCoordinateX'),
				db.settings.get('topRightCornerCropCoordinateY'),
				db.settings.get('bottomRightCornerCropCoordinateX'),
				db.settings.get('bottomRightCornerCropCoordinateY'),
				db.settings.get('bottomLeftCornerCropCoordinateX'),
				db.settings.get('bottomLeftCornerCropCoordinateY'),
				//db.entries.orderBy('date').filter((entry) => entry.draft !== true).reverse().toArray(),
				db.settings.get('scaleWidth'),
				db.settings.get('scaleHeight'),
				//db.entries.get( parseInt(_chosenEntryIdForAdjustments?.value as string) )
				db.settings.get('chosenEntryIdForAdjustments')
			]).then(([
				_topLeftCornerCropCoordinateX,
				_topLeftCornerCropCoordinateY,
				_topRightCornerCropCoordinateX,
				_topRightCornerCropCoordinateY,
				_bottomRightCornerCropCoordinateX,
				_bottomRightCornerCropCoordinateY,
				_bottomLeftCornerCropCoordinateX,
				_bottomLeftCornerCropCoordinateY,
				//_entries,
				_scaleWidthSetting,
				_scaleHeightSetting,
				//_currentEntry
				_chosenEntryIdForAdjustments
			]) => {
				console.group('got data from db'); 
				//console.log('got data from db'); 
				//console.dir(coordinates);
				//	originalCoordinatesFromDbRef.current = coordinates;
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
					setScaleWidth(_scaleWidthSetting.value as string);
				}
				if(_scaleHeightSetting) {
					setScaleHeight(_scaleHeightSetting.value as string);
				}
				/*
				entries = _entries;
				chosenEntryIdForAdjustments = _chosenEntryIdForAdjustments;
				scaleWidthSetting = _scaleWidthSetting;
				scaleHeightSetting = _scaleHeightSetting;
				currentEntry = _currentEntry;
				*/
				//setIsLoaded(true);
		if(_scaleWidthSetting && _scaleHeightSetting && _chosenEntryIdForAdjustments && _chosenEntryIdForAdjustments.value) {
			scaleChosenImage(_scaleWidthSetting, _scaleHeightSetting, _chosenEntryIdForAdjustments);
		}
				console.groupEnd();
				setLoadedInitialData(true);
			});
		//});
	}, [initialized.current]);









/*
	useEffect( () => {
			//initialize chosen crop image
			db.settings.get('chosenCropImageData').then( (chosenCropImageDataSetting) => {
				if(chosenCropImageDataSetting) {
					setScaledImageData(chosenCropImageDataSetting.value as string);
				}
			});
	}, []);
*/
/*	useEffect( () => {
		console.log('load original corner crop coordinates from db');
		loadCropCoordinatesFromDb();
	}, [activeCornerControlRef]);*/

	useEffect( () => {
		//console.log('useEffect handler called, trying to call updateCropCoordinatesinDb()');
		if(cropCornerCoordinatesInitialized && activeCornerControlRef.current != 'none') {
			//console.log('cropCornerCoordinates are initialized and activeCornerControlRef is not none, updating db');
			updateCropCoordinatesInDb();
			//ensure activeCornerControlRefRef is reset (corner reset case)
			activeCornerControlRef.current = activeCornerControlRef.current == 'all' ? 'none' : activeCornerControlRef.current;
		} else {
			console.warn('cropCornerCoordinates not intialized yet and/or activeCornerControlRef is not set');
		}
	}, [renderTrigger]);

	useEffect( () => {
		function updateResizeCanary() {
			setResizeCanary( Date.now());
		}
		window.addEventListener('resize', updateResizeCanary);
		return( () => {
			window.removeEventListener('resize', updateResizeCanary);
		});
	}, []);

	const resizeDebounceTimeoutId = useRef(0);
	useEffect( () => {
		//handle resize
		//clearTimeout(resizeDebounceTimeoutId.current);
		if( resizeCanary > 0 && resizeDebounceTimeoutId.current == 0) {
			resizeDebounceTimeoutId.current = window.setTimeout( () => {
				console.log('handle resize');
				loadCropCoordinatesFromDb().then( () => {
					console.log('after loadCropCordinates resolves');
					updateAdjustmentImageCornerCoordinates();
					updateScaledCornerCropCoordinates();
					setRenderTrigger(Date.now());
					resizeDebounceTimeoutId.current = 0;
				});
			}, 50);
		}
	}, [resizeCanary]);

	
	useEffect( () => {
		let handleMouseDown = (event: any) => {
			console.log('handleMouseDown() called');
			//console.dir(event.target);
			if(event.target.classList.contains(styles.cropCornerControl)) {
				event.preventDefault();
				//console.log('target is cropCornerControl');
				//console.log('controlId = ', event.target.dataset.controlId);
				activeCornerControlRef.current = event.target.dataset.controlId;
			}
		}
		
		let handleMouseUp = (event: any) => {
			if(activeCornerControlRef.current != 'all') {
			activeCornerControlRef.current = 'none';
			}
		}

		const getCoordinateBoundToImage = (baseCoordinate: Coordinate):Coordinate => {
			let boundCoordinate = { x: baseCoordinate.x, y: baseCoordinate.y };
			if(!currentCropImageRef.current){
				return boundCoordinate;
			}
			if(!currentCropImageRef.current){
				return boundCoordinate;
			}
			if(baseCoordinate.x < 0) {
				boundCoordinate.x = 0;
			}
			if(baseCoordinate.y < 0) {
				boundCoordinate.y = 0;
			}
			if(baseCoordinate.x > currentCropImageRef.current.clientWidth) {
				boundCoordinate.x = currentCropImageRef.current.clientWidth;
			}
			if(baseCoordinate.y > currentCropImageRef.current.clientHeight) {
				boundCoordinate.y = currentCropImageRef.current.clientHeight;
			}
			return boundCoordinate;
		};

		const getBoundTopLeftCornerCoordinate = (baseCoordinate:Coordinate):Coordinate => {
			let boundCoordinate = { ...baseCoordinate }
			if(baseCoordinate.x > topRightCornerCoordinateRef.current.x) {
				boundCoordinate.x = topRightCornerCoordinateRef.current.x
			}
			if(baseCoordinate.y > bottomLeftCornerCoordinateRef.current.y) {
				boundCoordinate.y = bottomLeftCornerCoordinateRef.current.y
			}
			return boundCoordinate;
		};

		const getBoundTopRightCornerCoordinate = (baseCoordinate:Coordinate):Coordinate => {
			let boundCoordinate = { ...baseCoordinate }
			if(baseCoordinate.x < topLeftCornerCoordinateRef.current.x) {
				boundCoordinate.x = topLeftCornerCoordinateRef.current.x
			}
			if(baseCoordinate.y > bottomRightCornerCoordinateRef.current.y) {
				boundCoordinate.y = bottomRightCornerCoordinateRef.current.y
			}
			return boundCoordinate;
		};
		
		const getBoundBottomRightCornerCoordinate = (baseCoordinate:Coordinate):Coordinate => {
			let boundCoordinate = { ...baseCoordinate }
			if(baseCoordinate.x < bottomLeftCornerCoordinateRef.current.x) {
				boundCoordinate.x = bottomLeftCornerCoordinateRef.current.x
			}
			if(baseCoordinate.y < topRightCornerCoordinateRef.current.y) {
				boundCoordinate.y = topRightCornerCoordinateRef.current.y
			}
			return boundCoordinate;
		};
		
		const getBoundBottomLeftCornerCoordinate = (baseCoordinate:Coordinate):Coordinate => {
			let boundCoordinate = { ...baseCoordinate }
			if(baseCoordinate.x > bottomRightCornerCoordinateRef.current.x) {
				boundCoordinate.x = bottomRightCornerCoordinateRef.current.x
			}
			if(baseCoordinate.y < topLeftCornerCoordinateRef.current.y) {
				boundCoordinate.y = topLeftCornerCoordinateRef.current.y
			}
			return boundCoordinate;
		};
		
		const handleMouseMove = (event: any) => {
			//console.dir(event);
			//console.log(`pageX=${event.pageX}, pageY=${event.pageY}`);
			//console.log(`screenX=${event.screenX}, screenY=${event.screenY}`);
			if(currentCropImageContainerRef.current) {
				const boundingRect = currentCropImageContainerRef.current.getBoundingClientRect();
				const newCoordinate = getCoordinateBoundToImage({
						x: event.pageX - boundingRect.left - window.scrollX, 
						y: event.pageY - boundingRect.top - window.scrollY
					});
				if(activeCornerControlRef.current === 'topLeft') {
					const boundCoordinate = getBoundTopLeftCornerCoordinate(newCoordinate);
					topLeftCornerCoordinateRef.current = boundCoordinate;
					topRightCornerCoordinateRef.current = {
						x: topRightCornerCoordinateRef.current.x,
						y: boundCoordinate.y
					};
					bottomLeftCornerCoordinateRef.current = {
						x: boundCoordinate.x,
						y: bottomLeftCornerCoordinateRef.current.y
					};
					setRenderTrigger(Date.now());
				} else if(activeCornerControlRef.current === 'topRight') {
					const boundCoordinate = getBoundTopRightCornerCoordinate(newCoordinate);
					topRightCornerCoordinateRef.current = boundCoordinate;
					topLeftCornerCoordinateRef.current = {
						x: topLeftCornerCoordinateRef.current.x,
						y: boundCoordinate.y
					};
					bottomRightCornerCoordinateRef.current = {
						x: boundCoordinate.x,
						y: bottomRightCornerCoordinateRef.current.y
					};
					setRenderTrigger(Date.now());
				} else if(activeCornerControlRef.current === 'bottomRight') {
					const boundCoordinate = getBoundBottomRightCornerCoordinate(newCoordinate);
					bottomRightCornerCoordinateRef.current = boundCoordinate;
					topRightCornerCoordinateRef.current = {
						x: boundCoordinate.x,
						y: topRightCornerCoordinateRef.current.y
					};
					bottomLeftCornerCoordinateRef.current = {
						x: bottomLeftCornerCoordinateRef.current.x,
						y: boundCoordinate.y
					};
					setRenderTrigger(Date.now());
				} else if(activeCornerControlRef.current === 'bottomLeft') {
					const boundCoordinate = getBoundBottomLeftCornerCoordinate(newCoordinate);
					bottomLeftCornerCoordinateRef.current = boundCoordinate;
					topLeftCornerCoordinateRef.current = {
						x: boundCoordinate.x,
						y: topLeftCornerCoordinateRef.current.y
					};
					bottomRightCornerCoordinateRef.current = {
						x: bottomRightCornerCoordinateRef.current.x,
						y: boundCoordinate.y
					};
					setRenderTrigger(Date.now());
				}		
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
	});
/*, [
		topLeftCornerCoordinateRef, 
		topRightCornerCoordinateRef, 
		bottomRightCornerCoordinateRef, 
		bottomLeftCornerCoordinateRef
	]);*/;
/*	
	useEffect( () => {
		if(scaleWidthSetting) {
			setScaleWidth(scaleWidthSetting.value as string);
		}
		if(scaleHeightSetting) {
			setScaleHeight(scaleHeightSetting.value as string);
		}
	}, [scaleWidthSetting, scaleHeightSetting]);
	*/
	const scaleChosenImage = async (scaleWidthSetting:Setting, scaleHeightSetting:Setting, chosenEntryIdForAdjustments:Setting) => {
		console.group('scaledChosenImage() called');
		if(
			scaleWidthSetting 
			&& parseFloat(scaleWidthSetting.value as string) > 0 
			&& scaleHeightSetting && parseFloat(scaleHeightSetting.value as string) > 0 
			&& chosenEntryIdForAdjustments
		) {
			console.warn('update chosen image scaling...');
			const _currentEntry = await db.entries.get( parseInt(chosenEntryIdForAdjustments.value as string));
			console.log('after await db: chosenEntryIdForAdjustments = ',chosenEntryIdForAdjustments);
			//console.log('current entry =', JSON.stringify(_currentEntry));
			if(_currentEntry && _currentEntry.imageBlob) {
				console.warn('_currentEntry exists...');
				const scaledImageWidth = parseFloat(scaleWidthSetting.value as string);
				const scaledImageHeight = parseFloat(scaleHeightSetting.value as string);
				
				let image = new Image();

				image.onload = async () => {
					let scaledImageCanvas = document.createElement('canvas');
					scaledImageCanvas.width = scaledImageWidth;
					scaledImageCanvas.height = scaledImageHeight;
					let scaledImageCanvasContext = scaledImageCanvas.getContext('2d');
					if(scaledImageCanvasContext) {
						scaledImageCanvasContext.drawImage(image, 0, 0, scaledImageWidth, scaledImageHeight); 
					}
					//setScaledImageData(scaledImageCanvas.toDataURL());
					scaledImageCanvas.toBlob( (blob) => {
						if(blob) {
							setScaledImageData(blob);
							setScaledImageDataUrl(blob ? URL.createObjectURL(blob) : '');
						}
					});
					
/////					let lastIdUpdated = await setCropCoordinatesToImageCornersInDb(scaledImageWidth, scaledImageHeight);

/*				loadCropCoordinatesFromDb().then( () => {
					console.log('after loadCropCordinates resolves');
					updateAdjustmentImageCornerCoordinates();
					updateScaledCornerCropCoordinates();
				});*/
					console.warn('end update chosen image scaling...');
				}
				//image.src = _currentEntry.image;
				image.src = URL.createObjectURL(_currentEntry.imageBlob);
					setRenderTrigger(Date.now());
			}
		}
		console.groupEnd();
	};

/*
	useEffect( () => {
		console.group('useEffect: scaleChosenImage(): chosenEntryIdForAdjustments = ',chosenEntryIdForAdjustments);
		if(scaleWidthSetting && scaleHeightSetting && chosenEntryIdForAdjustments) {
			scaleChosenImage(scaleWidthSetting, scaleHeightSetting, chosenEntryIdForAdjustments);
		}
		console.groupEnd();
	}, [scaleWidthSetting, scaleHeightSetting, chosenEntryIdForAdjustments]);
*/

	useEffect( () => {
		if(
			chosenEntryIdForAdjustments
			&& chosenEntryIdForAdjustments.value
		) {
			setCurrentSelectValue( parseInt(chosenEntryIdForAdjustments.value as string));
		}
	}, [chosenEntryIdForAdjustments]);

	const handleSetCropToCorners = () => {
		console.log('handleSetCropToCorners() called');
		activeCornerControlRef.current = 'all';
		updateAdjustmentImageCornerCoordinates();
		setCropCoordinatesToImageCorners();
		setRenderTrigger(Date.now());
	};
	
	const handleSelectOnChange = (event:ChangeEvent<HTMLSelectElement>) => {
		console.log('handleSelectOnChange() called');
		if(
			event
			&& event.target
			&& event.target.value
		) {
			setCurrentSelectValue( parseInt(event.target.value) );
		}
	};

	const setCropCoordinatesToImageCorners = () => {
			console.warn('setCropCoordinatesToImageCorners() called');
			if(currentCropImageContainerRef.current) {
				console.warn('setCropCoordinatesToImageCorners first condition');
				const boundingRect = currentCropImageContainerRef.current.getBoundingClientRect();
				topLeftCornerCoordinateRef.current = {
					x: imageTopLeftCoordinateRef.current.x - boundingRect.left,
					y: imageTopLeftCoordinateRef.current.y - boundingRect.top
				};
				topRightCornerCoordinateRef.current = {
					x: imageTopRightCoordinateRef.current.x - boundingRect.left,
					y: imageTopRightCoordinateRef.current.y - boundingRect.top
				};
				bottomRightCornerCoordinateRef.current = {
					x: imageBottomRightCoordinateRef.current.x - boundingRect.left,
					y: imageBottomRightCoordinateRef.current.y - boundingRect.top
				};
				bottomLeftCornerCoordinateRef.current = {
					x: imageBottomLeftCoordinateRef.current.x - boundingRect.left,
					y: imageBottomLeftCoordinateRef.current.y - boundingRect.top
				};
			}
	};

	
	//console.log('RENDER!');
	const allRelevantValidationsPassed = 
		validationResults.moreThanZeroEntries
		&& validationResults.allEntriesHaveImageBlob;
		/*
		&& validationResults.allEntriesHaveAlignedImageBlob 
		&& validationResults.allEntriesHaveDate
		&& validationResults.allEntriesHaveWeight
		&& validationResults.allEntriesHaveAllMarks
		&& validationResults.adjustmentImageCropAndScalingChosen;
		*/
 
	return (
		<>
		<div className="columns is-mobile is-centered">
			<div className="column is-12">
			<div className="hero is-small is-primary">
				<div className="hero-body">
    		<h2 className="title">Adjust</h2>
				<p className="subtitle">All images must be cropped and/or scaled to be the same size. On this page, configure the desired size and, if needed, cropping. Current chosenEntryIdForAdjustments = {chosenEntryIdForAdjustments?.value}</p>
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
						displayOnlyTheseValidations={['moreThanZeroEntries','allEntriesHaveImageBlob']}
					/>
				</div>
			</div>
		<div className="columns is-mobile is-centered">
			<div className="column is-11-mobile is-10-tablet is-8-desktop">
			{
				!allRelevantValidationsPassed &&
				<div className="message is-danger">
					<div className="message-body">
						<p>There are validation errors that must be fixed before a base image for adjustments can be chosen.</p>
					</div>
				</div>
			}
			{
				!loadedInitialData &&
				allRelevantValidationsPassed &&
				<p>Loading...</p>
			}
			{ 
				loadedInitialData && 
				allRelevantValidationsPassed &&
				<>
			<select 
				ref={imageSelectRef} 
				value={currentSelectValue} 
				onChange={handleSelectOnChange}
			>
				{
					entries?.map( (entry) => 
						<option 
							key={entry.id} 
							value={entry.id}
						>{entry.id}: {entry.date}
						</option>
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
			<label>
				Width:
				<input 
					type="number" 
					value={scaleWidth} 
					data-settings-key-to-modify="scaleWidth" 
					onChange={handleInputChange} 
				/>
			</label>
			<label>
				Height:
				<input 
					type="number" 
					value={scaleHeight} 
					data-settings-key-to-modify="scaleHeight" 
					onChange={handleInputChange} 
				/>
			</label>
			<button
				type="button"
				onClick={handleSetCropToCorners}
			>
				Reset Crop to Corners
			</button>
			<div className={styles.cropImageArea}>
				<div
					ref={loadingIndicatorRef} 
				>
					<p
						style={{
							fontSize: '2rem',
							fontWeight: 'bold',
					}}>LOADING IMAGE...</p>
				</div>
				<div 
					ref={currentCropImageContainerRef}
					className={`${styles.cropImageContainer} ${styles.notVisible}`}
					style={{
							background: '#000',
					}}
				>
					<img 
						src={ scaledImageDataUrl }
						ref={currentCropImageRef}
						onLoad={ () => {
							console.log('img onload fired!');
				//			updateScaledCornerCropCoordinates();
				loadCropCoordinatesFromDb().then( () => {
					console.log('after loadCropCordinates resolves');
					updateAdjustmentImageCornerCoordinates();
					updateScaledCornerCropCoordinates();
					setRenderTrigger(Date.now());
					resizeDebounceTimeoutId.current = 0;
				});
							currentCropImageContainerRef.current?.classList.remove(styles.notVisible);
							loadingIndicatorRef.current?.classList.add(styles.displayNone);
							//setIsLoaded(true);
						}}
						style={{ 
							maxWidth: '90vw', 
							maxHeight: '90vh',
							position: 'absolute',
							opacity: 0.2,
							left: 0,
							top: 0,
							filter: 'blur(3px)'
						}}/>
					<img 
						src={ scaledImageDataUrl }
						data-render-trigger={renderTrigger}
						style={{ 
							maxWidth: '90vw', 
							maxHeight: '90vh',
							clipPath: `inset(${topLeftCornerCoordinateRef.current.y}px ${(currentCropImageRef?.current?.clientWidth || 0) - topRightCornerCoordinateRef.current.x}px ${(currentCropImageRef?.current?.clientHeight || 0 ) - bottomRightCornerCoordinateRef.current.y}px ${bottomLeftCornerCoordinateRef.current.x}px)`
						}}/>
					<div 
						ref={topLeftCornerControl} 
						data-control-id="topLeft" 
						className={styles.cropCornerControl}
						style={{
							left: topLeftCornerCoordinateRef.current.x || 0,
							top: topLeftCornerCoordinateRef.current.y || 0,
							display: cropAdjustActive ? 'block' : 'none',
							background: 'red',
							borderColor: 'darkred'
						}}
					>
					</div>
					<div 
						ref={topRightCornerControl} 
						data-control-id="topRight" 
						className={styles.cropCornerControl}
						style={{
							left: topRightCornerCoordinateRef.current.x || 0,
							top: topRightCornerCoordinateRef.current.y || 0,
							display: cropAdjustActive ? 'block' : 'none',
							background: 'green',
							borderColor: 'darkgreen'
						}}
					>
					</div>
					<div 
						ref={bottomRightCornerControl} 
						data-control-id="bottomRight" 
						className={styles.cropCornerControl}
						style={{
							left: bottomRightCornerCoordinateRef.current.x || 0,
							top: bottomRightCornerCoordinateRef.current.y || 0,
							display: cropAdjustActive ? 'block' : 'none',
							background: 'blue',
							borderColor: 'darkblue'
						}}
					>
					</div>
					<div 
						ref={bottomLeftCornerControl} 
						data-control-id="bottomLeft" 
						className={styles.cropCornerControl}
						style={{
							left: bottomLeftCornerCoordinateRef.current.x || 0,
							top: bottomLeftCornerCoordinateRef.current.y || 0,
							display: cropAdjustActive ? 'block' : 'none',
							background: 'mediumpurple',
							borderColor: 'purple'
						}}
					>
					</div>
				</div>
				<p>{currentEntry?.id} date = {currentEntry?.date}</p>
			</div>
			</>
			}
			</div>
		</div>
		</>
  );
}

export default Adjust;
