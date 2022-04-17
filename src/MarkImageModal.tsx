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
import './MarkImageModal.css';

type MarkImageModalAttributes = {
	globalState: GlobalState,
	setGlobalState: Dispatch<SetStateAction<GlobalState>>,
	isModalVisible: boolean,
	setIsModalVisible: Dispatch<SetStateAction<boolean>>,
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
	'A': 'red',
	'B': 'green',
	'C': 'blue'
}

function MarkImageModal({
	globalState, 
	setGlobalState,
	isModalVisible,
	setIsModalVisible,
} : MarkImageModalAttributes ) {
	let [imageNaturalWidth, setImageNaturalWidth] = useState(0);
	let [imageNaturalHeight, setImageNaturalHeight] = useState(0);
	let [xHoverCoord, setXHoverCoord] = useState(0);
	let [yHoverCoord, setYHoverCoord] = useState(0);
	let [xNaturalHoverCoord, setXNaturalHoverCoord] = useState(0);
	let [yNaturalHoverCoord, setYNaturalHoverCoord] = useState(0);
	let [clientX, setClientX] = useState(0);
	let [clientY, setClientY] = useState(0);
	let [offsetLeft, setOffsetLeft] = useState(0);
	let [offsetTop, setOffsetTop] = useState(0);
	let [isHoverMarkerVisible, setIsHoverMarkerVisible] = useState(false);
	let [activeMark, setActiveMark] = useState("A");
	let [marks, setMarks] = useState<Marks>({});
	let [fullResImageData, setFullResImageData] = useState('');
	let [resizeCanary, setResizeCanary] = useState(false);

	const modalOverlayRef = useRef<HTMLDivElement>(null);
	const imageUploadRef = useRef<HTMLInputElement>(null);
  const loadImageButtonRef = useRef<HTMLButtonElement>(null);
	const imageCanvasRef = useRef<HTMLCanvasElement>(null);
	const imageContainerRef = useRef<HTMLDivElement>(null);
	const fullResImageCanvasRef = useRef<HTMLCanvasElement>(null);

	const currentEntry = useLiveQuery(
		() => db.entries.get(globalState.currentEntryId)
	, [globalState]);

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
		if(currentEntry && currentEntry.image) {
			let image = new Image();
			image.src = currentEntry.image;
			setImageNaturalWidth(image.naturalWidth);
			setImageNaturalHeight(image.naturalHeight);
		}
	}, [currentEntry]);

	useEffect( () => {
		console.log('intialize full-res canvas');
		if(!isModalVisible) {
				console.log('modal is not visisble, aborting...');
				return;
		}
		if(
			fullResImageCanvasRef.current 
			&& currentEntry 
			&& currentEntry.image
		) {
			const context = fullResImageCanvasRef.current.getContext('2d');
			const image = new Image();
			image.src = currentEntry.image;
			fullResImageCanvasRef.current.width = image.naturalWidth;
			fullResImageCanvasRef.current.height = image.naturalHeight;
			if(context) {
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
								//&& currentEntry.marks[key]
								//&& currentEntry.marks[key].style 
								//&& currentEntry.marks[key].x
								//&& currentEntry.marks[key].y
							) {
								console.log('draw mark, mark key = ', key, 'style =',currentEntry.marks[key].style);
								context.strokeStyle = currentEntry.marks[key].style;
								context.lineWidth = 10;
								context.beginPath();
								context.arc(currentEntry.marks[key].x, currentEntry.marks[key].y, 15, 0, 2*Math.PI);
								context.stroke();
							}
						});
					}
				}
			}
			setFullResImageData(fullResImageCanvasRef.current?.toDataURL());
		}
		
	}, [currentEntry, isModalVisible, resizeCanary]);


	useEffect( () => {
		//initialize canvas
		console.log('intialize canvas, current entry id = ', currentEntry?.id);
		if(!isModalVisible) {
				console.log('modal is not visisble, aborting...');
				return;
		}
		//console.log(`before: clientWidth = ${imageContainerRef?.current?.clientWidth}, clientHeight = ${imageContainerRef?.current?.clientHeight}`);
		if(
			imageCanvasRef.current 
			&& currentEntry 
			&& currentEntry.image
			&& imageContainerRef.current
			&& imageContainerRef.current.clientWidth
			&& imageContainerRef.current.clientHeight
			&& fullResImageCanvasRef.current
		) {
		const context = imageCanvasRef.current.getContext('2d');
		//const image = new Image();
		//image.src = currentEntry.image;
		//image.src = fullResImageCanvasRef.current.toDataURL();
		//setup canvas dimensions
		//console.log(`clientWidth = ${imageContainerRef.current.clientWidth}, clientHeight = ${imageContainerRef.current.clientHeight}`);
		let imageAspectRatio = fullResImageCanvasRef.current.width/fullResImageCanvasRef.current.height;
		let scaledImageWidth = imageContainerRef.current.clientHeight*imageAspectRatio;
		let scaledImageHeight = imageContainerRef.current.clientHeight;
		imageCanvasRef.current.width = scaledImageWidth;
		imageCanvasRef.current.height = scaledImageHeight;
		
		if(context) {	
		//context.clearRect(0,0,imageCanvasRef.current.width,imageCanvasRef.current.height);
		context.drawImage(fullResImageCanvasRef.current, 0, 0, scaledImageWidth, scaledImageHeight);
		}
		}
	}, [currentEntry, isModalVisible, resizeCanary]);

	let handleImageHover = (event:MouseEvent<HTMLCanvasElement>) => {
		//console.dir(event);
		let target = event.target as HTMLCanvasElement;
		if(
			target 
			&& target.offsetLeft 
			//&& target.offsetRight 
			&& target.offsetTop
			//&& target.offsetBottom
			&& target.clientWidth
			&& target.clientHeight
			//&& target.naturalWidth
			//&& target.naturalHeight
			&& event.clientX
			&& event.clientY
			&& currentEntry
			&& currentEntry.image
		)	{
			//console.log(`target.clientWidth = ${target.clientWidth}, target.clientHeight = ${target.clientHeight}`);
			let image = new Image();
			image.src = currentEntry.image;
			let widthRatio = image.naturalWidth / target.clientWidth;
			let heightRatio = image.naturalHeight / target.clientHeight;
			let xHoverCoord = event.clientX - target.offsetLeft;
			let yHoverCoord = event.clientY - target.offsetTop;
			setXHoverCoord(xHoverCoord);
			setYHoverCoord(yHoverCoord);
			setXNaturalHoverCoord(xHoverCoord*widthRatio);
			setYNaturalHoverCoord(yHoverCoord*heightRatio);
			setClientX(event.clientX);	
			setClientY(event.clientY);
			setOffsetLeft(target.offsetLeft);	
			//setOffsetRight(target.offsetRight);	
			setOffsetTop(target.offsetTop);	
			//setOffsetBottom(target.offsetBottom);	
		}
	};

	let handleImageMouseOver = (event:MouseEvent<HTMLCanvasElement>) => {
		setIsHoverMarkerVisible(true);
	}
	
	let handleImageMouseOut = (event:MouseEvent<HTMLCanvasElement>) => {
		setIsHoverMarkerVisible(false);
	}

	let handleImageClick = (event:MouseEvent<HTMLCanvasElement>) => {
		let target = event.target as HTMLCanvasElement;
		if(
			target 
			&& target.offsetLeft 
			&& target.offsetTop
			&& fullResImageCanvasRef.current
			&& imageCanvasRef.current
			&& currentEntry
		)	{
			let widthRatio = fullResImageCanvasRef.current.width / imageCanvasRef.current.width;
			let heightRatio = fullResImageCanvasRef.current.height / imageCanvasRef.current.height;
			let xClickValue = event.clientX - target.offsetLeft;
			let yClickValue = event.clientY - target.offsetTop;
			let fullResXClickValue = xClickValue * widthRatio;
			let fullResYClickValue = yClickValue * heightRatio;
			console.log(`xClickValue = ${xClickValue}, yClickValue = ${yClickValue}`);
			console.log(`fullResXClickValue = ${fullResXClickValue}, fullResYClickValue = ${fullResYClickValue}`);
			/*setMarks( (cs) => {
				let ns = { [activeMark]: {
										x: fullResXClickValue, 
										y: fullResYClickValue, 
										fillStyle: markFillStyles[activeMark]
									}}
				return {...cs, ...ns};
			});*/
			/*let newMark = { [activeMark]: {
									x: fullResXClickValue, 
									y: fullResYClickValue, 
									style: markFillStyles[activeMark]
								}}*/
			let newMarkData = { 
									x: fullResXClickValue, 
									y: fullResYClickValue, 
									style: markFillStyles[activeMark]
								}
			const markUpdateKey = 'marks.'+activeMark;
			//let updatedMarks = {...currentEntry.marks, ...newMark};
			db.entries.update(globalState.currentEntryId, {
				['marks.'+activeMark]: newMarkData
			});
			//console.log('marks = ');
			//console.dir(currentEntry.marks);
		}
	}

	useEffect( () => {
		if(modalOverlayRef.current) {
			isModalVisible ? 
				modalOverlayRef.current.classList.add("modalVisible")
				:
				modalOverlayRef.current.classList.remove("modalVisible");
		}

	}, [isModalVisible]);

	//<div className="imageContainer" style={{backgroundImage: 'url("'+currentEntry?.image+'")'}}>
	
	return (
    <div ref={modalOverlayRef} className="modalOverlay">
			<div className="contentContainer">
				<div className="header">
					<h2>Mark Image</h2>
					<div className="debugInfo">
						<p>
							Updating entry with id = { globalState.currentEntryId }, 
							imageNatWidth = {imageNaturalWidth}, imageNatHeight = {imageNaturalHeight}, 
							xHoverCoord = {xHoverCoord}, yHoverCoord = {yHoverCoord}, 
							xNaturalHoverCoord = {xNaturalHoverCoord.toFixed(2)}, 
							yNaturalHoverCoord = {yNaturalHoverCoord.toFixed(2)},
							clientX = {clientX}, clientY = {clientY},
							offsetLeft = {offsetLeft}, offsetTop = {offsetTop},
							activeMark = {activeMark}
						</p>
					</div>
				</div>
				<div ref={imageContainerRef} className="imageContainer">
					<canvas
						ref={imageCanvasRef}
						className="entryImage" 
						onMouseMove={handleImageHover}
						onMouseOver={handleImageMouseOver}
						onMouseOut={handleImageMouseOut}
						onClick={handleImageClick}
					/>
					<div 
						className={"hoverMarker" + (isHoverMarkerVisible ? " hoverMarkerVisible" : "") + ( activeMark ? ' activeMark'+activeMark : '')}
						style={{
							left: clientX, 
							top: clientY,
							backgroundImage: 'url("'+fullResImageData+'")',
							//backgroundPosition: 'right '+(xNaturalHoverCoord-offsetLeft-xHoverCoord)+'px bottom '+(yNaturalHoverCoord-offsetTop-yHoverCoord)+'px',
							//backgroundPosition: 'left 0px top 0px'
							backgroundPosition: 'left calc(-'+(xNaturalHoverCoord)+'px + 9vh) top calc(-'+(yNaturalHoverCoord)+'px + 9vh)',
						}}
					>
					</div>
					{
					/*<div 
						className="clickMarker" 
						style={{
							left: clickX, 
							top: clickY,
						}}
					>
					</div>*/
					}
					<canvas ref={fullResImageCanvasRef} style={{visibility: "hidden"}} />
						
				</div>
				<div className="footer">
					<button 
						type="button"
						className={ 'markButtonA' + (activeMark === 'A' ? ' markButtonCurrentlyActive' : '')}
						onClick={ () => setActiveMark('A') }
					>
						Set Mark A
					</button>
					<button 
						type="button" 
						className={ 'markButtonB' + (activeMark === 'B' ? ' markButtonCurrentlyActive' : '')}
						onClick={ () => setActiveMark('B') }
					>
						Set Mark B
					</button>
					<button 
						type="button" 
						className={ 'markButtonC' + (activeMark === 'C' ? ' markButtonCurrentlyActive' : '')}
						onClick={ () => setActiveMark('C')}
					>
						Set Mark C
					</button>
					&nbsp; -- &nbsp; 
					<button 
						type="button" 
						className="closeButton"
						onClick={ () => setIsModalVisible(false) }
					>
							Close
					</button>
				</div>
			</div>
    </div>
  );
}

export default MarkImageModal;
