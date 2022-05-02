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
import './ChangeImageModal.css';

type ChangeImageModalAttributes= {
	globalState: GlobalState,
	setGlobalState: Dispatch<SetStateAction<GlobalState>>,
	isModalVisible: boolean,
	setIsModalVisible: Dispatch<SetStateAction<boolean>>,
};

function ChangeImageModal({
	globalState, 
	setGlobalState,
	isModalVisible,
	setIsModalVisible,
} : ChangeImageModalAttributes ) {

	
	let modalOverlayRef = useRef<HTMLDivElement>(null);
	let imageUploadRef = useRef<HTMLInputElement>(null);
  let loadImageButtonRef = useRef<HTMLButtonElement>(null);
	let selectImageButtonRef = useRef<HTMLButtonElement>(null);
	let fileHandleRef = useRef<any>(null);

	/*useEffect( () => {
		const addDbEntry = async (imageData:string) => {
			console.log("adding db entry...");
			try {
				const date = ((new Date()).toISOString()).substring(0, 16); //datetime needs to be more robust
				const weight = parseFloat((Math.random()*200).toFixed(2));
				const image = imageData;
				const id = await db.entries.add({
					date,
					weight,
					image
				});
			} catch(error) {
				console.error(`failed to add db entry. ${error}`);
			}
		};*/

	
	const loadImageHandler = async (event:MouseEvent<HTMLButtonElement>) => {
		//console.dir(imageUploadRef.current);
		console.log("handle load image..");
		let selectedFile;
		if(imageUploadRef.current && imageUploadRef.current.files) {
			selectedFile = imageUploadRef.current.files[0];
			db.entries.update(globalState.currentEntryId, {
				imageBlob: selectedFile
			});
					setIsModalVisible(false);
			//console.log('selected file objectURL=');
			//console.dir(URL.createObjectURL(selectedFile));
		}
		/*const reader = new FileReader();
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
		*/
	};
	

	/*
 	//file api approach
	const loadImageHandler = async (event:MouseEvent<HTMLButtonElement>) => {
		//console.dir(imageUploadRef.current);
		console.log("handle load image..");
		if(fileHandleRef.current) {
			db.entries.update(globalState.currentEntryId, {
				imageFileHandle: fileHandleRef.current
			});
		};
		setIsModalVisible(false);
		//console.dir(URL.createObjectURL(selectedFile));
	};
	*/

	const selectImageHandler = async (event:MouseEvent<HTMLButtonElement>) => {
		  const [fileHandle] = await window.showOpenFilePicker();
			console.log('fileHandle = ');
			console.dir(fileHandle);
			fileHandleRef.current = fileHandle;
	};

	useEffect( () => {
		if(modalOverlayRef.current) {
			isModalVisible ? 
				modalOverlayRef.current.classList.add("modalVisible")
				:
				modalOverlayRef.current.classList.remove("modalVisible");
		}

	}, [isModalVisible]);

	return (
    <div ref={modalOverlayRef} className="modalOverlay">
			<div className="controlsContainer">
				<h1>Change Image</h1>
				<p>Updating entry with id = { globalState.currentEntryId }.</p>
				{/*<button ref={selectImageButtonRef} type="button" onClick={selectImageHandler}>
					Select Image
				</button>*/}
				<input ref={imageUploadRef} type="file"></input>
				<button ref={loadImageButtonRef} type="button" onClick={loadImageHandler}>
					Load Image
				</button>
				<button type="button" onClick={ () => setIsModalVisible(false) }>Cancel</button>
			</div>
    </div>
  );
}

export default ChangeImageModal;
