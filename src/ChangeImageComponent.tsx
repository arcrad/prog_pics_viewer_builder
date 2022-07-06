import 
	React, 
	{ 
		useState, 
		useEffect, 
		useRef, 
	} from 'react';
import {
	useNavigate,
	useParams,
} from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
	faUpload, 
} from '@fortawesome/free-solid-svg-icons'

import { db, Entry } from './db';
import { GlobalState } from './App';

type ChangeImageComponentAttributes= {
	closeModalOnLoad: boolean;
	afterLoadImageFn?: () => void;
};

function ChangeImageComponent({
	closeModalOnLoad,
	afterLoadImageFn,
} : ChangeImageComponentAttributes ) {
	let [statusMessages, setStatusMessages] = useState<string[]>([]);
	
	let modalOverlayRef = useRef<HTMLDivElement>(null);
	let imageUploadContainerRef = useRef<HTMLDivElement>(null);
	let imageUploadRef = useRef<HTMLInputElement>(null);
	let imageUploadFileNameRef = useRef<HTMLSpanElement>(null);
  let loadImageButtonRef = useRef<HTMLButtonElement>(null);
	let selectImageButtonRef = useRef<HTMLButtonElement>(null);
	let fileHandleRef = useRef<any>(null);

	let navigate = useNavigate();
	
	let { entryId } = useParams();
	
	useEffect( () => {
		if(imageUploadRef && imageUploadRef.current) {
			imageUploadRef.current.onchange = () => {
				if(imageUploadRef.current 
					&& imageUploadRef.current.files
					&& imageUploadRef.current.files.length > 0) {
						if(imageUploadFileNameRef.current) {
		      		imageUploadFileNameRef.current.textContent = imageUploadRef.current.files[0].name;
							handleImageLoad();
						}
    		}
			};
		}
	},[]);
	
	const handleImageLoad = async () => {
		//console.dir(imageUploadRef.current);
		console.log("handle load image..");
		const scaledImageMaxDimension = 
			(await db.settings.get('defaultBaseImageMaxDimension')).value || 1920;
		console.log(`fetched setting defaultBaseImageMaxDimension = ${scaledImageMaxDimension}`);
		setStatusMessages(["Started loading image..."]);
		let selectedFile:File;
		if(imageUploadRef.current && imageUploadRef.current.files) {
			selectedFile = imageUploadRef.current.files[0];
			//create temp image to get dimensions
			let tempImage = new Image();
			tempImage.onload = () => {
				setStatusMessages( cs => [...cs, "Image loaded."]);
				//setup scaled image resources
				let scaledImageWidth = tempImage.naturalWidth;
				let scaledImageHeight = tempImage.naturalHeight;
				if(tempImage.naturalWidth > scaledImageMaxDimension || tempImage.naturalHeight > scaledImageMaxDimension) {
					if( tempImage.naturalWidth > tempImage.naturalHeight) {
						//landscape
						scaledImageWidth = scaledImageMaxDimension;
						scaledImageHeight = tempImage.naturalHeight / (tempImage.naturalWidth / scaledImageMaxDimension);
					} else {
						//square or portrait
						scaledImageWidth = tempImage.naturalWidth / (tempImage.naturalHeight / scaledImageMaxDimension);
						scaledImageHeight = scaledImageMaxDimension;
					}
				}
				const scaledImageCanvas = document.createElement('canvas');
				scaledImageCanvas.width = scaledImageWidth;
				scaledImageCanvas.height = scaledImageHeight;
				const scaledImageCanvasContext = scaledImageCanvas.getContext('2d');
				//setup thumbnail resources
				const thumbMaxDimension = 300;
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
				if(thumbCanvasContext && scaledImageCanvasContext) {
					scaledImageCanvasContext.drawImage(tempImage, 0, 0, scaledImageWidth, scaledImageHeight);
					thumbCanvasContext.drawImage(tempImage, 0, 0, thumbWidth, thumbHeight);
					thumbCanvas.toBlob( async (thumbBlob) => {
						if(entryId != null ) {
							await db.entries.update(parseInt(entryId), {
								thumbImageBlob: new Uint8Array(await thumbBlob.arrayBuffer())
							});
							//thumb blob saved
							setStatusMessages( cs => [...cs, "Saved thumbnail data."]);
							scaledImageCanvas.toBlob( async (scaledImageBlob) => {
								await db.entries.update(parseInt(entryId), {
									imageBlob: new Uint8Array(await scaledImageBlob.arrayBuffer()),
									//imageArrayBuffer: await selectedFile.arrayBuffer(),
									//imageBlobBlob: selectedFile.slice(0, selectedFile.size, selectedFile.type),
									imageNaturalWidth: scaledImageWidth,
									imageNaturalHeight: scaledImageHeight
								});
								setStatusMessages( cs => [...cs, "Saved full resolution image data."]);
								//make upload button success color
								if(imageUploadContainerRef.current) {
									imageUploadContainerRef.current.classList.add('is-success');
								}
								if(closeModalOnLoad) {
									navigate('/entry');
									setStatusMessages([]);
								}
								if(afterLoadImageFn) {
									afterLoadImageFn();
								}
							}, "image/jpeg", 0.95);
						}
					}, "image/jpeg", 0.75);
				}
			}
			tempImage.src = URL.createObjectURL(selectedFile);
			//console.log('selected file objectURL=');
			//console.dir(URL.createObjectURL(selectedFile));
		}
	};
	return (
		<>
			<div className="columns">
				<div className="column is-flex is-justify-content-center">
					<div 
						ref={imageUploadContainerRef}
						className="file is-boxed has-name"
					>
						<label className="file-label">
							<input 
								ref={imageUploadRef} 
								type="file"
								className="file-input"
							/>
							<span className="file-cta">
								<FontAwesomeIcon icon={faUpload}/>
								<span className="file-label">
									Choose an image...
								</span>
							</span>
							<span ref={imageUploadFileNameRef} className="file-name"></span>
						</label>
					</div>
				</div>
			</div>
			<div className="columns">
				<div className="column is-cenetered is-12">
					<div className="field">
						<label className="label">Image Load Status</label>
						<div className="control">
							<textarea
								className="textarea"
								defaultValue={
									statusMessages?.reduce( (accumulator, message) => {
										return accumulator + message + "\n";
									}, "")
								}
							></textarea>
						</div>
					</div>
				</div>
			</div>
		</>
  );
}

export default ChangeImageComponent;
