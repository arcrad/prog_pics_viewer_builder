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

type Coordinate = {
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
		= useState<Coordinate>({// x: 25, y: 25});
				x: globalState.settings.topLeftCornerCropCoordinateX as number,
				y: globalState.settings.topLeftCornerCropCoordinateY as number
			});
	let [topRightCornerCoordinate, setTopRightCornerCoordinate] 
		= useState<Coordinate>({// x: 0, y:0});
				x: globalState.settings.topRightCornerCropCoordinateX as number,
				y: globalState.settings.topRightCornerCropCoordinateY as number
			});
	let [bottomRightCornerCoordinate, setBottomRightCornerCoordinate] 
		= useState<Coordinate>({// x: 0, y:0});
				x: globalState.settings.bottomRightCornerCropCoordinateX as number,
				y: globalState.settings.bottomRightCornerCropCoordinateY as number
			});
	let [bottomLeftCornerCoordinate, setBottomLeftCornerCoordinate] 
		= useState<Coordinate>({// x: 0, y:0});
				x: globalState.settings.bottomLeftCornerCropCoordinateX as number,
				y: globalState.settings.bottomLeftCornerCropCoordinateY as number
			});

	/*let [imageTopLeftCoordinate, setImageTopLeftCoordinate]
		= useState<Coordinate>({ x: 0, y: 0});
	let [imageTopRightCoordinate, setImageTopRightCoordinate]
		= useState<Coordinate>({ x: 0, y: 0});
	let [imageBottomRightCoordinate, setImageBottomRightCoordinate]
		= useState<Coordinate>({ x: 0, y: 0});
	let [imageBottomLeftCoordinate, setImageBottomLeftCoordinate]
		= useState<Coordinate>({ x: 0, y: 0});*/

	
	let imageTopLeftCoordinateRef
		= useRef<Coordinate>({ x: 0, y: 0});
	let imageTopRightCoordinateRef
		= useRef<Coordinate>({ x: 0, y: 0});
	let imageBottomRightCoordinateRef
		= useRef<Coordinate>({ x: 0, y: 0});
	let imageBottomLeftCoordinateRef
		= useRef<Coordinate>({ x: 0, y: 0});

	let [resizeCanary, setResizeCanary] = useState(false);

	//let [activeCornerControl, setActiveCornerControl] = useState("none");
	const activeCornerControl = useRef('none');

	const currentCropImageContainerRef = useRef<HTMLImageElement>(null);
	const currentCropImageRef = useRef<HTMLImageElement>(null);

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

	/*let topLeftCornerCropCoordinateXSetting = useLiveQuery( () => {
		return db.settings.get('topLeftCornerCropCoordinateX')
	});
	let topLeftCornerCropCoordinateYSetting = useLiveQuery( () => {
		return db.settings.get('topLeftCornerCropCoordinateY')
	});

	let topRightCornerCropCoordinateXSetting = useLiveQuery( () => {
		return db.settings.get('topRightCornerCropCoordinateX')
	});
	let topRightCornerCropCoordinateYSetting = useLiveQuery( () => {
		return db.settings.get('topRightCornerCropCoordinateY')
	});


	let bottomRightCornerCropCoordinateXSetting = useLiveQuery( () => {
		return db.settings.get('bottomRightCornerCropCoordinateX')
	});
	let bottomRightCornerCropCoordinateYSetting = useLiveQuery( () => {
		return db.settings.get('bottomRightCornerCropCoordinateY')
	});

	let bottomLeftCornerCropCoordinateXSetting = useLiveQuery( () => {
		return db.settings.get('bottomLeftCornerCropCoordinateX')
	});
	let bottomLeftCornerCropCoordinateYSetting = useLiveQuery( () => {
		return db.settings.get('bottomLeftCornerCropCoordinateY')
	});*/

	let currentEntry = useLiveQuery(
		() => {
			if(chosenEntryIdForAdjustments) {
				console.log('setting currentEntry');
				return db.entries.get( parseInt(chosenEntryIdForAdjustments.value as string) );
			}
		}
	, [chosenEntryIdForAdjustments]);


/*////////////////////	
	useEffect( () => {
			Promise.all([
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
				console.dir(coordinates)
				if( coordinates[0]?.value && coordinates[1]?.value) {
					setTopLeftCornerCoordinate({
						x: coordinates[0].value as number,
						y: coordinates[1].value as number
					});
				}
				if( coordinates[2]?.value && coordinates[3]?.value) {
					setTopRightCornerCoordinate({
						x: coordinates[2].value as number,
						y: coordinates[3].value as number
					});
				}
				if( coordinates[4]?.value && coordinates[5]?.value) {
					setBottomRightCornerCoordinate({
						x: coordinates[4].value as number,
						y: coordinates[5].value as number
					});
				}
				if( coordinates[6]?.value && coordinates[7]?.value) {
					setBottomLeftCornerCoordinate({
						x: coordinates[6].value as number,
						y: coordinates[7].value as number
					});
				}
			});
		//getAllCornerCoordinatesFromDb.then( (result) => { console.log('got corner coords from db'); console.dir(result)});
	},[]);
*/

	useEffect( () => {
		function updateResizeCanary() {
			setResizeCanary( (cs) => !cs );
		}
		window.addEventListener('resize', updateResizeCanary);
		return( () => {
			window.removeEventListener('resize', updateResizeCanary);
		});

	}, []);

	const updateAdjustmentImageCornerCoordinates = () => {
		if(currentCropImageContainerRef.current && currentCropImageRef.current) {	
			//console.log('currentCropImageContainerRef.current = ');
			//console.dir(currentCropImageRef.current);
			console.log(`offsetLeft = ${currentCropImageContainerRef.current.offsetLeft}, offsetTop = ${currentCropImageContainerRef.current.offsetTop}`);
			imageTopLeftCoordinateRef.current = {
				x: currentCropImageContainerRef.current.offsetLeft,
				y: currentCropImageContainerRef.current.offsetTop
			};
			imageTopRightCoordinateRef.current = {
				x: currentCropImageContainerRef.current.offsetLeft + currentCropImageRef.current.clientWidth,
				y: currentCropImageContainerRef.current.offsetTop
			};
			imageBottomRightCoordinateRef.current = {
				x: currentCropImageContainerRef.current.offsetLeft + currentCropImageRef.current.clientWidth,
				y: currentCropImageContainerRef.current.offsetTop + currentCropImageRef.current.clientHeight
			};
			imageBottomLeftCoordinateRef.current = {
				x: currentCropImageContainerRef.current.offsetLeft,
				y: currentCropImageContainerRef.current.offsetTop + currentCropImageRef.current.clientHeight
			};
		}
	};

	const resetCropCornerCoordinates = () => {
		//updateAdjustmentImageCornerCoordinates();
		//setCropCoordinatesToImageCorners();
		initializeCropCornerCoordinates();
	}

	/*useEffect( () => {
		
		const updateImageCornerCoordinatesOnImageLoad = () => {
			console.log('adjust corner coordinates onload!');
			updateAdjustmentImageCornerCoordinates();
		};
		if(currentCropImageRef.current) {
			currentCropImageRef.current.addEventListener('load', updateImageCornerCoordinatesOnImageLoad);
		}
		return () => {
			if(currentCropImageRef.current) {
				currentCropImageRef.current.removeEventListener('load', updateImageCornerCoordinatesOnImageLoad);
			}
		}
	}, []);*/

	useEffect( () => {
		//handle resize
		console.log('handle resize');
		updateAdjustmentImageCornerCoordinates();
		initializeCropCornerCoordinates();
	}, [resizeCanary]);

	const debounceUpdateCoordinatesInDbTimeout = useRef(0);


//	useEffect( () => {
		function initializeCropCornerCoordinates() {
			let xScaleFactor = 1;
			let yScaleFactor = 1;
			if(currentCropImageContainerRef.current && currentCropImageRef.current) {	
				xScaleFactor = currentCropImageRef.current.naturalWidth / currentCropImageRef.current.clientWidth;
				yScaleFactor = currentCropImageRef.current.naturalHeight / currentCropImageRef.current.clientHeight;
			}
			console.log(`xScaleFactor = ${xScaleFactor}, yScaleFactor = ${yScaleFactor}`);
			Promise.all([
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
				console.dir(coordinates)
				if( coordinates[0]?.value && coordinates[1]?.value) {
					setTopLeftCornerCoordinate({
						x: coordinates[0].value as number / xScaleFactor,
						y: coordinates[1].value as number / yScaleFactor
					});
				}
				if( coordinates[2]?.value && coordinates[3]?.value) {
					setTopRightCornerCoordinate({
						x: coordinates[2].value as number / xScaleFactor,
						y: coordinates[3].value as number / yScaleFactor
					});
				}
				if( coordinates[4]?.value && coordinates[5]?.value) {
					setBottomRightCornerCoordinate({
						x: coordinates[4].value as number / xScaleFactor,
						y: coordinates[5].value as number / yScaleFactor 
					});
				}
				if( coordinates[6]?.value && coordinates[7]?.value) {
					setBottomLeftCornerCoordinate({
						x: coordinates[6].value as number / xScaleFactor,
						y: coordinates[7].value as number / yScaleFactor
					});
				}
			});
		/*if(globalState.settings.topLeftCornerCropCoordinateX
		&& globalState.settings.topLeftCornerCropCoordinateY) {
			setTopLeftCornerCoordinate({
				x: globalState.settings.topLeftCornerCropCoordinateX as number,
				y: globalState.settings.topLeftCornerCropCoordinateY as number
			});
		}
		if( globalState.settings.topRightCornerCropCoordinateX
		&& globalState.settings.topRightCornerCropCoordinateY ) {
			setTopRightCornerCoordinate({
				x: globalState.settings.topRightCornerCropCoordinateX as number,
				y: globalState.settings.topRightCornerCropCoordinateY as number
			});
		}
		if( globalState.settings.bottomRightCornerCropCoordinateX
		&& globalState.settings.bottomRightCornerCropCoordinateY ) {
			setBottomRightCornerCoordinate({
				x: globalState.settings.bottomRightCornerCropCoordinateX as number,
				y: globalState.settings.bottomRightCornerCropCoordinateY as number
			});
		}
		if( globalState.settings.bottomLeftCornerCropCoordinateX 
		&& globalState.settings.bottomLeftCornerCropCoordinateY) {
			setBottomLeftCornerCoordinate({
				x: globalState.settings.bottomLeftCornerCropCoordinateX as number,
				y: globalState.settings.bottomLeftCornerCropCoordinateY as number
			});
			}*/
		}
	//	initializeCropCornerCoordinates();
	//}, [
		//topLeftCornerCropCoordinateXSetting, 
		//topLeftCornerCropCoordinateYSetting,
		//topRightCornerCropCoordinateXSetting, 
		//topRightCornerCropCoordinateYSetting,
		//bottomRightCornerCropCoordinateXSetting, 
		//bottomRightCornerCropCoordinateYSetting,
		//bottomLeftCornerCropCoordinateXSetting, 
		//bottomLeftCornerCropCoordinateYSetting
	//]);	

	const updateCropCoordinatesInDb = () => {
		window.clearTimeout(debounceUpdateCoordinatesInDbTimeout.current);
		debounceUpdateCoordinatesInDbTimeout.current = window.setTimeout( async () => {
			console.log('updating crop coordinate in DB...');
			let xScaleFactor = 1;
			let yScaleFactor = 1;
			if(currentCropImageContainerRef.current && currentCropImageRef.current) {	
				xScaleFactor = currentCropImageRef.current.naturalWidth / currentCropImageRef.current.clientWidth;
				yScaleFactor = currentCropImageRef.current.naturalHeight / currentCropImageRef.current.clientHeight;
			}
			console.log(`xScaleFactor = ${xScaleFactor}, yScaleFactor = ${yScaleFactor}`);
			try {
				let idsUpdated = [];
				idsUpdated.push(await db.settings.put(
					{ key: "topLeftCornerCropCoordinateX", value: topLeftCornerCoordinate.x * xScaleFactor }
				));
				idsUpdated.push(await db.settings.put(
					{ key: "topLeftCornerCropCoordinateY", value: topLeftCornerCoordinate.y * yScaleFactor }
				));
				///
				idsUpdated.push(await db.settings.put(
					{ key: "topRightCornerCropCoordinateX", value: topRightCornerCoordinate.x * xScaleFactor }
				));
				idsUpdated.push(await db.settings.put(
					{ key: "topRightCornerCropCoordinateY", value: topRightCornerCoordinate.y * yScaleFactor }
				));
				//
				idsUpdated.push(await db.settings.put(
					{ key: "bottomRightCornerCropCoordinateX", value: bottomRightCornerCoordinate.x * xScaleFactor }
				));
				idsUpdated.push(await db.settings.put(
					{ key: "bottomRightCornerCropCoordinateY", value: bottomRightCornerCoordinate.y * yScaleFactor }
				));
				//
				idsUpdated.push(await db.settings.put(
					{ key: "bottomLeftCornerCropCoordinateX", value: bottomLeftCornerCoordinate.x * xScaleFactor }
				));
				idsUpdated.push(await db.settings.put(
					{ key: "bottomLeftCornerCropCoordinateY", value: bottomLeftCornerCoordinate.y * yScaleFactor }
				));
				console.log(`ids updated = ${idsUpdated.join(', ')}`);
			} catch(error) {
				console.error(`failed to add db entry. ${error}`);
			}
		}, 250);
	};
	
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
			if(baseCoordinate.x > topRightCornerCoordinate.x) {
				boundCoordinate.x = topRightCornerCoordinate.x
			}
			if(baseCoordinate.y > bottomLeftCornerCoordinate.y) {
				boundCoordinate.y = bottomLeftCornerCoordinate.y
			}
			return boundCoordinate;
		};

		const getBoundTopRightCornerCoordinate = (baseCoordinate:Coordinate):Coordinate => {
			let boundCoordinate = { ...baseCoordinate }
			if(baseCoordinate.x < topLeftCornerCoordinate.x) {
				boundCoordinate.x = topLeftCornerCoordinate.x
			}
			if(baseCoordinate.y > bottomRightCornerCoordinate.y) {
				boundCoordinate.y = bottomRightCornerCoordinate.y
			}
			return boundCoordinate;
		};
		
		const getBoundBottomRightCornerCoordinate = (baseCoordinate:Coordinate):Coordinate => {
			let boundCoordinate = { ...baseCoordinate }
			if(baseCoordinate.x < bottomLeftCornerCoordinate.x) {
				boundCoordinate.x = bottomLeftCornerCoordinate.x
			}
			if(baseCoordinate.y < topRightCornerCoordinate.y) {
				boundCoordinate.y = topRightCornerCoordinate.y
			}
			return boundCoordinate;
		};
		
		const getBoundBottomLeftCornerCoordinate = (baseCoordinate:Coordinate):Coordinate => {
			let boundCoordinate = { ...baseCoordinate }
			if(baseCoordinate.x > bottomRightCornerCoordinate.x) {
				boundCoordinate.x = bottomRightCornerCoordinate.x
			}
			if(baseCoordinate.y < topLeftCornerCoordinate.y) {
				boundCoordinate.y = topLeftCornerCoordinate.y
			}
			return boundCoordinate;
		};
		
		let handleMouseMove = (event: any) => {
			//console.dir(event);
			if(currentCropImageContainerRef.current) {
				const newCoordinate = getCoordinateBoundToImage({
						x: event.pageX - currentCropImageContainerRef.current.offsetLeft, 
						y: event.pageY - currentCropImageContainerRef.current.offsetTop
					});
				if(activeCornerControl.current === 'topLeft') {
					const boundCoordinate = getBoundTopLeftCornerCoordinate(newCoordinate);
					setTopLeftCornerCoordinate(boundCoordinate);
					setTopRightCornerCoordinate( (cs) => ({
						x: cs.x,
						y: boundCoordinate.y
					}));
					setBottomLeftCornerCoordinate( (cs) => ({
						x: boundCoordinate.x,
						y: cs.y
					}));
		updateCropCoordinatesInDb();
				} else if(activeCornerControl.current === 'topRight') {
					const boundCoordinate = getBoundTopRightCornerCoordinate(newCoordinate);
					setTopRightCornerCoordinate(boundCoordinate);
					setTopLeftCornerCoordinate( (cs) => ({
						x: cs.x,
						y: boundCoordinate.y
					}));
					setBottomRightCornerCoordinate( (cs) => ({
						x: boundCoordinate.x,
						y: cs.y
					}));
		updateCropCoordinatesInDb();
				} else if(activeCornerControl.current === 'bottomRight') {
					const boundCoordinate = getBoundBottomRightCornerCoordinate(newCoordinate);
					setBottomRightCornerCoordinate(boundCoordinate);
					setTopRightCornerCoordinate( (cs) => ({
						x: boundCoordinate.x,
						y: cs.y
					}));
					setBottomLeftCornerCoordinate( (cs) => ({
						x: cs.x,
						y: boundCoordinate.y
					}));
		updateCropCoordinatesInDb();
				} else if(activeCornerControl.current === 'bottomLeft') {
					const boundCoordinate = getBoundBottomLeftCornerCoordinate(newCoordinate);
					setBottomLeftCornerCoordinate(boundCoordinate);
					setTopLeftCornerCoordinate( (cs) => ({
						x: boundCoordinate.x,
						y: cs.y
					}));
					setBottomRightCornerCoordinate( (cs) => ({
						x: cs.x,
						y: boundCoordinate.y
					}));
		updateCropCoordinatesInDb();
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
		//[topLeftCornerCoordinate, topRightCornerCoordinate, bottomRightCornerCoordinate, bottomLeftCornerCoordinate]);
	
	/*useEffect( () => {
		updateCropCoordinatesInDb();
	}, [topLeftCornerCoordinate, topRightCornerCoordinate, bottomRightCornerCoordinate, bottomLeftCornerCoordinate]);*/
	
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

	const setCropCoordinatesToImageCorners = () => {
			if(currentCropImageContainerRef.current) {
				setTopLeftCornerCoordinate({
					x: imageTopLeftCoordinateRef.current.x - currentCropImageContainerRef.current.offsetLeft,
					y: imageTopLeftCoordinateRef.current.y - currentCropImageContainerRef.current.offsetTop
				});
				setTopRightCornerCoordinate({
					x: imageTopRightCoordinateRef.current.x - currentCropImageContainerRef.current.offsetLeft,
					y: imageTopRightCoordinateRef.current.y - currentCropImageContainerRef.current.offsetTop
				});
				setBottomRightCornerCoordinate({
					x: imageBottomRightCoordinateRef.current.x - currentCropImageContainerRef.current.offsetLeft,
					y: imageBottomRightCoordinateRef.current.y - currentCropImageContainerRef.current.offsetTop
				});
				setBottomLeftCornerCoordinate({
					x: imageBottomLeftCoordinateRef.current.x - currentCropImageContainerRef.current.offsetLeft,
					y: imageBottomLeftCoordinateRef.current.y - currentCropImageContainerRef.current.offsetTop
				});
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
				setCropCoordinatesToImageCorners();
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
				<div 
					ref={currentCropImageContainerRef}
					className="cropImageContainer"
					style={{
						//background: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${currentEntry?.image})`, 
	//					background: `url(${currentEntry?.image})`, 
		//				backgroundSize: 'contain'
//						background: `rgba(0,255,255,0.5)`
					}}
				>
					<img 
						src={currentEntry?.image} 
						onLoad={resetCropCornerCoordinates}
						style={{ 
							maxWidth: '90vw', 
							maxHeight: '90vh',
							position: 'absolute',
							opacity: 0.5,
							left: 0,
							top: 0
						}}/>
					<img 
						ref={currentCropImageRef}
						src={currentEntry?.image} 
						onLoad={resetCropCornerCoordinates}
						style={{ 
							maxWidth: '90vw', 
							maxHeight: '90vh',
							clipPath: `inset(${topLeftCornerCoordinate.y}px ${(currentCropImageRef?.current?.clientWidth || 0) - topRightCornerCoordinate.x}px ${(currentCropImageRef?.current?.clientHeight || 0 ) - bottomRightCornerCoordinate.y}px ${bottomLeftCornerCoordinate.x}px)`
						}}/>
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
					{/*
					<div
						style={{
							background: 'rgba(0,0,0,0.2)',
							position: 'absolute',
							height: '100%',
							width: '100%',
							left: 0,
							top: 0,
							//clipPath: `inset(${topLeftCornerCoordinate.y}px, ${topRightCornerCoordinate.y}px, ${bottomRightCornerCoordinate.y}px, ${bottomLeftCornerCoordinate.x}px)`,
							//left: topLeftCornerCoordinate.x,
							//top: topLeftCornerCoordinate.y,
							//width: topRightCornerCoordinate.x - topLeftCornerCoordinate.x,
							//height: bottomRightCornerCoordinate.y - topRightCornerCoordinate.y,
							zIndex: 7000
						}}
					>
					</div>
					*/}
				</div>
				<p>{currentEntry?.id} date = {currentEntry?.date}</p>
			</div>
		</div>
  );
}


export default Adjust;
