import 
	React, 
	{ 
		useState, 
		useEffect, 
		useLayoutEffect,
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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
	faCrosshairs, 
	faLocationCrosshairs, 
} from '@fortawesome/free-solid-svg-icons'

import { db, Entry } from './db';
import { GlobalState } from './App';

import styles from './MarkImageComponent.module.css';

type MarkImageComponentAttributes = {
	globalState: GlobalState,
	setGlobalState: Dispatch<SetStateAction<GlobalState>>,
	isLoaded: boolean,
	setIsLoaded: Dispatch<SetStateAction<boolean>>,
};

type MarkPoint = {
	x: number,
	y: number,
	fillStyle: string
}

type Marks = {
	[key:string]: MarkPoint
}

type MarkFillStyles = {
	[key: string]: string
}

const markFillStyles:MarkFillStyles = {
	'A': '#c01',
	'B': 'green',
	'C': '#12c'
}

function MarkImageComponent({
	globalState, 
	setGlobalState,
	isLoaded,
	setIsLoaded
} : MarkImageComponentAttributes ) {
	let [xNaturalHoverCoord, setXNaturalHoverCoord] = useState(0);
	let [yNaturalHoverCoord, setYNaturalHoverCoord] = useState(0);
	let [hoverX, setHoverX] = useState(0);
	let [hoverY, setHoverY] = useState(0);
	let [imageCanvasOffsetLeft, setImageCanvasOffsetLeft] = useState(0);
	let [imageCanvasOffsetTop, setImageCanvasOffsetTop] = useState(0);
	let [isHoverMarkerVisible, setIsHoverMarkerVisible] = useState(false);
	let [activeMark, setActiveMark] = useState("A");
	let [marks, setMarks] = useState<Marks>({});
	let [fullResImageData, setFullResImageData] = useState('');
	let [resizeCanary, setResizeCanary] = useState(false);
	let [entryHasImage, setEntryHasImage] = useState(false);
	//let [isLoaded, setIsLoaded] = useState(false);
	let [renderTrigger, setRenderTrigger] = useState(Date.now());

	const imageUploadRef = useRef<HTMLInputElement>(null);
  const loadImageButtonRef = useRef<HTMLButtonElement>(null);
	const imageCanvasRef = useRef<HTMLCanvasElement>(null);
	const imageContainerRef = useRef<HTMLDivElement>(null);
	const fullResImageCanvasRef = useRef<HTMLCanvasElement>(null);

	let { entryId } = useParams();
	let currentEntry = useLiveQuery(
		() =>	db.entries.get(parseInt(entryId != null ? entryId : '0'))
	, [entryId]);

	useEffect( () => {
		setActiveMark('A');
	}, []);

	useEffect( () => {
		function updateResizeCanary() {
			setResizeCanary( (cs) => !cs );
		}
		window.addEventListener('resize', updateResizeCanary);
		return( () => {
			window.removeEventListener('resize', updateResizeCanary);
		});

	}, []);

	useEffect( () => {
		//render full-res entry image
		console.log('render full-res canvas');
	/*	if(!isModalVisible) {
				console.log('modal is not visible, aborting render...');
				return;
		}*/
		const image = new Image();
		//image.src = currentEntry.image;
		image.onload = () => {
			if(
				fullResImageCanvasRef.current 
				&& currentEntry 
				&& currentEntry.imageBlob
			) {
				console.log('render full-res entry image: onload');
				const context = fullResImageCanvasRef.current.getContext('2d');
				fullResImageCanvasRef.current.width = image.naturalWidth;
				fullResImageCanvasRef.current.height = image.naturalHeight;
				console.log(`width = ${image.naturalWidth} and height = ${image.naturalHeight}`);
				if(context) {
					context.clearRect(0, 0, image.naturalWidth, image.naturalHeight);
					context.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight);
					if(currentEntry.marks) {
						if(Object.keys(currentEntry.marks)) {
							console.log('found marks');
							Object.keys(currentEntry.marks).forEach( (key) => {
								//console.log('loop mark key = ', key);
								//console.dir(currentEntry?.marks?.[key]);
								if(
									currentEntry
									&& currentEntry.marks
									&& fullResImageCanvasRef.current
								) {
									console.log(
										'draw mark, mark key = ', key, 
										'style =',currentEntry.marks[key].style,
										'x = ', currentEntry.marks[key].x, 
										'y = ', currentEntry.marks[key].y
									);
									//draw contrast circle (white)
									context.strokeStyle = "#fff";
									context.lineWidth = fullResImageCanvasRef.current.width * globalState.settings.markLineWidthScalePercent*1.5;
									context.beginPath();
									context.arc(
										currentEntry.marks[key].x, 
										currentEntry.marks[key].y, 
										fullResImageCanvasRef.current.width * globalState.settings.markRadiusScalePercent, 
										0, 
										2*Math.PI
									);
									context.stroke();
									//draw marker circle (colorful)
									context.strokeStyle = currentEntry.marks[key].style;
									context.lineWidth = fullResImageCanvasRef.current.width * globalState.settings.markLineWidthScalePercent;
									context.beginPath();
									context.arc(
										currentEntry.marks[key].x, 
										currentEntry.marks[key].y, 
										fullResImageCanvasRef.current.width * globalState.settings.markRadiusScalePercent, 
										0, 
										2*Math.PI
									);
									context.stroke();
								}
							});
						}
					}
				}
				//setFullResImageData(fullResImageCanvasRef.current?.toDataURL());
				if(fullResImageCanvasRef.current) {
					fullResImageCanvasRef.current.toBlob( (blob) => {
						if(blob) {
							console.log('update setFullResImageData');
							setFullResImageData(URL.createObjectURL(blob));
							renderScaledCanvas();
							setIsLoaded(true);
						}
					});
				}
			}
		};
		if(currentEntry) {
			if(currentEntry.imageBlob) {
				setEntryHasImage(true);
				image.src = URL.createObjectURL(new Blob([currentEntry.imageBlob.buffer]));
			} else {
				setEntryHasImage(false);
			}
		}	
	}, [currentEntry]);

	const renderScaledCanvas = () => {
		//render scaled canvas
		console.log('render scaled canvas, current entry id = ', currentEntry?.id);
		console.dir(currentEntry);
		//console.log(`before: clientWidth = ${imageContainerRef?.current?.clientWidth}, clientHeight = ${imageContainerRef?.current?.clientHeight}`);
		if(
			imageCanvasRef.current 
			&& currentEntry 
			&& currentEntry.imageBlob
			&& imageContainerRef.current
			&& imageContainerRef.current.clientWidth
			&& imageContainerRef.current.clientHeight
			&& fullResImageCanvasRef.current
		) {
			const context = imageCanvasRef.current.getContext('2d');
			console.log(`clientWidth = ${imageContainerRef.current.clientWidth}, clientHeight = ${imageContainerRef.current.clientHeight}`);
			let imageAspectRatio = 
				fullResImageCanvasRef.current.width/fullResImageCanvasRef.current.height;
			let imageContainerAspectRatio = 
				imageContainerRef.current.clientWidth/imageContainerRef.current.clientHeight;
			//determine image scaling based on aspect ratio of image and container 
			let scaledImageWidth = 0;
			let scaledImageHeight = 0;
			if(imageAspectRatio > 1) {
				//image is wider than tall
				console.log('image is wider than tall');
				//so scale by width
				scaledImageWidth = imageContainerRef.current.clientWidth;
				scaledImageHeight = imageContainerRef.current.clientWidth/imageAspectRatio;
				//unless container is shorter than image, then limit on height
				if(imageContainerRef.current.clientHeight < scaledImageHeight) {
					scaledImageWidth = imageContainerRef.current.clientHeight*imageAspectRatio;
					scaledImageHeight = imageContainerRef.current.clientHeight;
				}
			} else {
				//image is taller than wide or square
				console.log('image is taller than wide');
				//so scale by height
				scaledImageWidth = imageContainerRef.current.clientHeight*imageAspectRatio;
				scaledImageHeight = imageContainerRef.current.clientHeight;
				//unless container is narrower than image, then limit on width
				if(imageContainerRef.current.clientWidth < scaledImageWidth) {
					scaledImageWidth = imageContainerRef.current.clientWidth;
					scaledImageHeight = imageContainerRef.current.clientWidth/imageAspectRatio;
				}
			}
			//ensure image ultimately doesnt end up bigger than full-res
			if(scaledImageWidth > fullResImageCanvasRef.current.width || scaledImageHeight > fullResImageCanvasRef.current.height) {
				scaledImageWidth = fullResImageCanvasRef.current.width;
				scaledImageHeight = fullResImageCanvasRef.current.height;
			}
			//update canvas dimensions
			imageCanvasRef.current.width = scaledImageWidth;
			imageCanvasRef.current.height = scaledImageHeight;
			
			if(context) {	
				context.clearRect(0, 0, imageCanvasRef.current.width, imageCanvasRef.current.height);
				context.drawImage(fullResImageCanvasRef.current, 0, 0, scaledImageWidth, scaledImageHeight);
				if(!isLoaded) {
					setRenderTrigger(Date.now());
				}
				//setIsLoaded(true);
			}
		}
	}

	useEffect( () => {
		renderScaledCanvas();
	}, [currentEntry, renderTrigger, resizeCanary]);
	
	let doImageHoverPositionUpdate = (event, target) => {
		console.log('doImageHoverPositionUpdate() called');
		const boundingRect = target.getBoundingClientRect();
		let widthRatio = currentEntry.imageNaturalWidth / target.clientWidth;
		let heightRatio = currentEntry.imageNaturalHeight / target.clientHeight;
		let xHoverCoord = event.clientX - boundingRect.x;
		let yHoverCoord = event.clientY - boundingRect.y;
		setXNaturalHoverCoord(xHoverCoord*widthRatio);
		setYNaturalHoverCoord(yHoverCoord*heightRatio);
		setHoverX(xHoverCoord);
		setHoverY(yHoverCoord);
		setImageCanvasOffsetLeft(target.offsetLeft);	
		setImageCanvasOffsetTop(target.offsetTop);	
	};
	
	let doUpdateImageMark = (
		event,
		target,
		targetOffsetLeft,
		targetOffsetTop,
		fullResImageCanvasRefCurrent,
		imageCanvasRefCurrent,
		currentEntry		
	) => {
		const boundingRect = target.getBoundingClientRect();
		let widthRatio = fullResImageCanvasRefCurrent.width / imageCanvasRefCurrent.width;
		let heightRatio = fullResImageCanvasRefCurrent.height / imageCanvasRefCurrent.height;
		let xClickValue = event.clientX - boundingRect.x;
		let yClickValue = event.clientY - boundingRect.y;
		let fullResXClickValue = xClickValue * widthRatio;
		let fullResYClickValue = yClickValue * heightRatio;
		console.log(`xClickValue = ${xClickValue}, yClickValue = ${yClickValue}`);
		console.log(`fullResXClickValue = ${fullResXClickValue}, fullResYClickValue = ${fullResYClickValue}`);
		let newMarkData = { 
			x: fullResXClickValue, 
			y: fullResYClickValue, 
			style: markFillStyles[activeMark]
		}
		const markUpdateKey = 'marks.'+activeMark;
		//let updatedMarks = {...currentEntry.marks, ...newMark};
		if(entryId) {
			db.entries.update(parseInt(entryId), {
				['marks.'+activeMark]: newMarkData
			}).then( () => {
				setRenderTrigger(Date.now());
			});
		}
	};

	let handleImageHover = (event:MouseEvent<HTMLCanvasElement>) => {
		console.dir(event);
		let target = event.target as HTMLCanvasElement;
		if(
			target !== undefined
			&& target.offsetLeft !== undefined
			&& target.offsetTop !== undefined
			&& target.clientWidth !== undefined
			&& target.clientHeight !== undefined
			&& event.clientX !== undefined
			&& event.clientY !== undefined
			&& event.pageX !== undefined
			&& event.pageY !== undefined
			&& currentEntry !== undefined
			&& currentEntry.imageNaturalWidth !== undefined
			&& currentEntry.imageNaturalHeight !== undefined
		)	{
			//console.log(`target.clientWidth = ${target.clientWidth}, target.clientHeight = ${target.clientHeight}`);
			//console.log(`currentEntry.imageNaturalWidth = ${currentEntry.imageNaturalWidth} && curentEntry.imageNaturalHeight = ${currentEntry.imageNaturalHeight}`);
			doImageHoverPositionUpdate(event, target);
		}
	};

	let handleImageMouseOver = (event:MouseEvent<HTMLCanvasElement>) => {
		setIsHoverMarkerVisible(true);
	}
	
	let handleImageMouseOut = (event:MouseEvent<HTMLCanvasElement>) => {
		setIsHoverMarkerVisible(false);
	}
	
	let handleImageTouchStart = (event) => {
		let target = event.target as HTMLCanvasElement;
		if(
			event.touches !== undefined
			&& event.touches.length === 1
			&& event.touches[0] !== undefined
			&& event.touches[0].clientX !== undefined
			&& event.touches[0].clientY !== undefined
			&& event.touches[0].pageX !== undefined
			&& event.touches[0].pageY !== undefined
			&& target !== undefined
			&& target.offsetLeft !== undefined
			&& target.offsetTop !== undefined
			&& target.clientWidth !== undefined
			&& target.clientHeight !== undefined
			&& currentEntry !== undefined
			&& currentEntry.imageNaturalWidth !== undefined
			&& currentEntry.imageNaturalHeight !== undefined
		)	{
			console.log('do touch move update' , event.blah);
			doImageHoverPositionUpdate(event.touches[0], target);
		}
		setIsHoverMarkerVisible(true);
	};
	
	let handleImageTouchMove = (event) => {
		//console.dir(event);	
		console.log('handleimagetouchmove() called');
		let target = event.target as HTMLCanvasElement;
		if(
			event.touches !== undefined
			&& event.touches.length === 1
			&& event.touches[0] !== undefined
			&& event.touches[0].clientX !== undefined
			&& event.touches[0].clientY !== undefined
			&& event.touches[0].pageX !== undefined
			&& event.touches[0].pageY !== undefined
			&& target !== undefined
			&& target.offsetLeft !== undefined
			&& target.offsetTop !== undefined
			&& target.clientWidth !== undefined
			&& target.clientHeight !== undefined
			&& currentEntry !== undefined
			&& currentEntry.imageNaturalWidth !== undefined
			&& currentEntry.imageNaturalHeight !== undefined
		)	{
			console.log('do touch move update');
			doImageHoverPositionUpdate(event.touches[0], target);
		}
	};

	let handleImageTouchEnd = (event) => {
		console.dir(event);
		let target = event.target as HTMLCanvasElement;
		if(
			event.changedTouches[0]
			&& target !== undefined
			&& target.offsetLeft !== undefined 
			&& target.offsetTop !== undefined
			&& fullResImageCanvasRef.current
			&& imageCanvasRef.current
			&& currentEntry !== undefined
		)	{
			//console.log(`offsetLeft = ${target.offsetLeft}, offsetTop = ${target.offsetTop}`);
			doUpdateImageMark(
				event.changedTouches[0],
				target,
				target.offsetLeft,
				target.offsetTop,
				fullResImageCanvasRef.current,
				imageCanvasRef.current,
				currentEntry		
			)
		}
		setIsHoverMarkerVisible(false);
	};
	
	let handleImageClick = (event:MouseEvent<HTMLCanvasElement>) => {
		let target = event.target as HTMLCanvasElement;
		if(
			target !== undefined
			&& target.offsetLeft !== undefined 
			&& target.offsetTop !== undefined
			&& fullResImageCanvasRef.current
			&& imageCanvasRef.current
			&& currentEntry !== undefined
		)	{
			console.log(`full width = ${fullResImageCanvasRef.current.width} / scale width = ${imageCanvasRef.current.width}`);
			console.log(`full height = ${fullResImageCanvasRef.current.height} / scale height = ${imageCanvasRef.current.height}`);
			//console.log('marks = ');
			//console.dir(currentEntry.marks);
			doUpdateImageMark(
				event,
				target,
				target.offsetLeft,
				target.offsetTop,
				fullResImageCanvasRef.current,
				imageCanvasRef.current,
				currentEntry		
			)
		}
	}

	let handleCloseButton = () => {
		setIsLoaded(false);
		//setIsModalVisible(false);
	};

	return (
		<>
			<p className="mb-4">Mark three points on the image that will be used to align this image with the other entries' images.</p>
			<div className={styles.controlsContainer}>
				<div className="field is-grouped is-grouped-centered">
					<div className="control">
						<button 
							type="button"
							className={`button ${styles.markButtonA} ${(activeMark === 'A' ? styles.markButtonCurrentlyActive : '')}`}
							onClick={ () => setActiveMark('A') }
						>
							<FontAwesomeIcon icon={faLocationCrosshairs}/>&nbsp;Mark A
						</button>
					</div>
					<div className="control">
						<button 
							type="button" 
							className={`button ${styles.markButtonB} ${(activeMark === 'B' ? styles.markButtonCurrentlyActive : '')}`}
							onClick={ () => setActiveMark('B') }
						>
							<FontAwesomeIcon icon={faLocationCrosshairs}/>&nbsp;Mark B
						</button>
					</div>
					<div className="control">
						<button 
							type="button" 
							className={`button ${styles.markButtonC} ${(activeMark === 'C' ? styles.markButtonCurrentlyActive : '')}`}
							onClick={ () => setActiveMark('C')}
						>
							<FontAwesomeIcon icon={faLocationCrosshairs}/>&nbsp;Mark C
						</button>				
					</div>
				</div>
			</div>
			<div ref={imageContainerRef} className={styles.imageContainer}>
				<div className={styles.imageSandwich}>
				<canvas
						ref={imageCanvasRef}
						className={styles.entryImage}
						data-rt={renderTrigger}
						style={{display: (isLoaded ? 'block' : 'none')}}
						onMouseMove={handleImageHover}
						onMouseOver={handleImageMouseOver}
						onMouseOut={handleImageMouseOut}
						onTouchMove={handleImageTouchMove}
						onTouchStart={handleImageTouchStart}
						onTouchEnd={handleImageTouchEnd}
						onClick={handleImageClick}
					/>
					{ !entryHasImage && <p>Entry has no image</p>} 
					{ entryHasImage && !isLoaded && <p>loading image...</p> }
				<div 
					className={`${styles.hoverMarkerTriangle} ${(isHoverMarkerVisible ? styles.hoverMarkerTriangleVisible : "")} ${( activeMark ? 'activeMark'+activeMark : '')}`}
					style={{
						left: hoverX,
						top: hoverY
					}}
				></div>
				<div 
					className={`${styles.hoverMarker} ${(isHoverMarkerVisible ? styles.hoverMarkerVisible : "")} ${( activeMark ? 'activeMark'+activeMark : '')}`}
					style={{
						left: hoverX,
						top:hoverY,
						backgroundImage: 'url("'+fullResImageData+'")',
						backgroundPosition: 'left calc(-'+(xNaturalHoverCoord)+'px + 9vh) top calc(-'+(yNaturalHoverCoord)+'px + 9vh)',
					}}
				>
					<div className={styles.hoverMarkerCrosshairContainer}>
							<FontAwesomeIcon icon={faCrosshairs}/>
					</div>
				</div>
				</div>
			</div>
			<canvas ref={fullResImageCanvasRef} style={{visibility: "hidden", height: 0, width: 0, pointerEvents: 'none'}} />
				{/*
				<div className="debugInfo">
					<p>
						Updating entry with id = { globalState.currentEntryId }, 
						xNaturalHoverCoord = {xNaturalHoverCoord.toFixed(2)}, 
						yNaturalHoverCoord = {yNaturalHoverCoord.toFixed(2)},
						clientX = {clientX}, clientY = {clientY},
						activeMark = {activeMark}
						isLoaded = { isLoaded ? 'true' : 'false' }
					</p>
				</div>
				*/}
		</>
  );
}

export default MarkImageComponent;
