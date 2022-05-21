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
import {
	useNavigate,
	useParams,
} from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';

import { db, Entry } from './db';
import { GlobalState } from './App';
//import './ChangeImageComponent.css';

type ChangeImageComponentAttributes= {
	//globalState: GlobalState;
	//setGlobalState: Dispatch<SetStateAction<GlobalState>>;
//	isModalVisible: boolean;
//	setIsModalVisible: Dispatch<SetStateAction<boolean>>;
	closeModalOnLoad: boolean;
	afterLoadImageFn?: () => void;
};

function ChangeImageComponent({
	//globalState, 
	//setGlobalState,
//	isModalVisible,
//	setIsModalVisible,
	closeModalOnLoad,
	afterLoadImageFn,
} : ChangeImageComponentAttributes ) {
	let [statusMessages, setStatusMessages] = useState<string[]>([]);
	
	let modalOverlayRef = useRef<HTMLDivElement>(null);
	let imageUploadRef = useRef<HTMLInputElement>(null);
  let loadImageButtonRef = useRef<HTMLButtonElement>(null);
	let selectImageButtonRef = useRef<HTMLButtonElement>(null);
	let fileHandleRef = useRef<any>(null);

	let navigate = useNavigate();
	
	let { entryId } = useParams();
	
	const loadImageHandler = async (event:MouseEvent<HTMLButtonElement>) => {
		//console.dir(imageUploadRef.current);
		console.log("handle load image..");
		setStatusMessages(["adding image start"]);
		let selectedFile:File;
		if(imageUploadRef.current && imageUploadRef.current.files) {
			selectedFile = imageUploadRef.current.files[0];
			//create temp image to get dimensions
			let tempImage = new Image();
			tempImage.onload = () => {
				setStatusMessages( cs => [...cs, "image file loaded"]);
				//generate thumbnail, if needed
				const thumbMaxDimension = 300;
				//if(tempImage.naturalWidth > thumbMaxDimension || tempImage.naturalHeight > thumbMaxDimension) {
					let thumbWidth = tempImage.naturalWidth;
					let thumbHeight = tempImage.naturalHeight;
					if( tempImage.naturalWidth > tempImage.naturalHeight) {
						//landscape
						thumbWidth = thumbMaxDimension;
						thumbHeight = tempImage.naturalHeight / (tempImage.naturalWidth / thumbMaxDimension);
					} else {
						//square or portrait
						thumbWidth = tempImage.naturalWidth / (tempImage.naturalHeight / thumbMaxDimension);
						thumbHeight = thumbMaxDimension;
					}
					const thumbCanvas = document.createElement('canvas');
					thumbCanvas.width = thumbWidth;
					thumbCanvas.height = thumbHeight;
					const thumbCanvasContext = thumbCanvas.getContext('2d');
					if(thumbCanvasContext) {
						thumbCanvasContext.drawImage(tempImage, 0, 0, thumbWidth, thumbHeight);
						thumbCanvas.toBlob( (blob) => {
							if(entryId != null ) {
							db.entries.update(parseInt(entryId), {
								thumbImageBlob: blob
							}).then( () => {
								//thumb blob saved
								setStatusMessages( cs => [...cs, "saved thumbnail data"]);
								if(entryId != null) {
								db.entries.update(parseInt(entryId), {
									imageBlob: selectedFile,
									imageNaturalWidth: tempImage.naturalWidth,
									imageNaturalHeight: tempImage.naturalHeight
								}).then( () => {
									setStatusMessages( cs => [...cs, "saved full-res image data"]);
									if(closeModalOnLoad) {
									//	setIsModalVisible(false);
										navigate('/entry');
										setStatusMessages([]);
									}
									if(afterLoadImageFn) {
										afterLoadImageFn();
									}
								});
								}
							});
							}
						});
					}
				//} else {
					//use original image as thumbnail
				//}
			}
			tempImage.src = URL.createObjectURL(selectedFile);
			//console.log('selected file objectURL=');
			//console.dir(URL.createObjectURL(selectedFile));
		}
	};
	
	const selectImageHandler = async (event:MouseEvent<HTMLButtonElement>) => {
		  const [fileHandle] = await window.showOpenFilePicker();
			console.log('fileHandle = ');
			console.dir(fileHandle);
			fileHandleRef.current = fileHandle;
	};

	return (
			<>
				<p>Updating entry with id = { entryId }.</p>
				<p>Messages:</p>
				<ul>
				{
					statusMessages?.map( (message, index) => {
						return <li key={index}>{message}</li>
					})
				}
				</ul>
				{/*<button ref={selectImageButtonRef} type="button" onClick={selectImageHandler}>
					Select Image
				</button>*/}
				<input ref={imageUploadRef} type="file"></input>
				<button ref={loadImageButtonRef} type="button" onClick={loadImageHandler}>
					Load Image
				</button>
				{/*<button type="button" onClick={ () => setIsModalVisible(false) }>Cancel</button>*/}
			</>
  );
}

export default ChangeImageComponent;