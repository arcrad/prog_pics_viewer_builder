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
	let [clickX, setClickX] = useState(0);
	let [clickY, setClickY] = useState(0);

	const modalOverlayRef = useRef<HTMLDivElement>(null);
	const imageUploadRef = useRef<HTMLInputElement>(null);
  const loadImageButtonRef = useRef<HTMLButtonElement>(null);
	const imageCanvasRef = useRef<HTMLCanvasElement>(null);
	const imageContainerRef = useRef<HTMLDivElement>(null);

	const currentEntry = useLiveQuery(
		() => db.entries.get(globalState.currentEntryId)
	, [globalState]);

	useEffect( () => {
		if(currentEntry && currentEntry.image) {
			let image = new Image();
			image.src = currentEntry.image;
			setImageNaturalWidth(image.naturalWidth);
			setImageNaturalHeight(image.naturalHeight);
		}
	}, [currentEntry]);

	useEffect( () => {
		//initialize canvas
		console.log('intialize canvas, current entry id = ', currentEntry?.id);
		console.log(`before: clientWidth = ${imageContainerRef?.current?.clientWidth}, clientHeight = ${imageContainerRef?.current?.clientHeight}`);
		if(
			imageCanvasRef.current 
			&& currentEntry 
			&& currentEntry.image
			&& imageContainerRef.current
			&& imageContainerRef.current.clientWidth
			&& imageContainerRef.current.clientHeight
		) {
		const context = imageCanvasRef.current.getContext('2d');
		const image = new Image();
		image.src = currentEntry.image;
		//setup canvas dimensions
		console.log(`clientWidth = ${imageContainerRef.current.clientWidth}, clientHeight = ${imageContainerRef.current.clientHeight}`);
		let imageAspectRatio = image.naturalWidth/image.naturalHeight;
		let scaledImageWidth = imageContainerRef.current.clientHeight*imageAspectRatio;
		let scaledImageHeight = imageContainerRef.current.clientHeight;
		imageCanvasRef.current.width = scaledImageWidth;
		imageCanvasRef.current.height = scaledImageHeight;
		
		if(context) {	
		//context.clearRect(0,0,imageCanvasRef.current.width,imageCanvasRef.current.height);
		context.drawImage(image, 0, 0, scaledImageWidth, scaledImageHeight);
		}
		}
	}, [currentEntry, isModalVisible]);
	/*
	const loadImageHandler = async (event:MouseEvent<HTMLButtonElement>) => {
		//console.dir(imageUploadRef.current);
		console.log("handle load image..");
		let selectedFile;
		if(imageUploadRef.current && imageUploadRef.current.files) {
			selectedFile = imageUploadRef.current.files[0];
		}
		const reader = new FileReader();
		reader.onload = (event) => {
			if(event.target && event.target.result) {
				console.log("result=", event.target.result);
				if(typeof event.target.result === "string") {
					//update current entry with image data
					db.entries.update(globalState.currentEntryId, {
						image: event.target.result
					});
					setIsModalVisible(false);
				}
			}
		};
		if(selectedFile) {
			//reader.readAsText(selectedFile);
			reader.readAsDataURL(selectedFile);
		}
	};
	*/

	let handleImageHover = (event:MouseEvent<HTMLCanvasElement>) => {
		//console.dir(event);
		let target = event.target as HTMLCanvasElement;
		if(
			target 
			&& target.offsetLeft 
			//&& target.offsetRight 
			&& target.offsetTop
			//&& target.offsetBottom
			&& target.width
			&& target.height
			//&& target.naturalWidth
			//&& target.naturalHeight
			&& event.clientX
			&& event.clientY
			&& currentEntry
			&& currentEntry.image
		)	{
			let image = new Image();
			image.src = currentEntry.image;
			let widthRatio = image.naturalWidth / target.width;
			let heightRatio = image.naturalHeight / target.height;
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
		)	{
			let xClickCoord = event.clientX - target.offsetLeft;
			let yClickCoord = event.clientY - target.offsetTop;
			setClickX(event.clientX);
			setClickY(event.clientY);
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
							clickX = {clickX}, clickY = {clickY}
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
						className={"hoverMarker" + (isHoverMarkerVisible ? " hoverMarkerVisible" : "")} 
						style={{
							left: clientX, 
							top: clientY,
							backgroundImage: 'url("'+currentEntry?.image+'")',
							//backgroundPosition: 'right '+(xNaturalHoverCoord-offsetLeft-xHoverCoord)+'px bottom '+(yNaturalHoverCoord-offsetTop-yHoverCoord)+'px',
							//backgroundPosition: 'left 0px top 0px'
							backgroundPosition: 'left calc(-'+(xNaturalHoverCoord)+'px + 9vw) top calc(-'+(yNaturalHoverCoord)+'px + 9vh)',
						}}
					>
					</div>
					<div 
						className="clickMarker" 
						style={{
							left: clickX, 
							top: clickY,
						}}
					>
					</div>
				</div>
				<div className="footer">
					<button type="button" onClick={ () => setIsModalVisible(false) }>Close</button>
				</div>
			</div>
    </div>
  );
}

export default MarkImageModal;
