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

	
	let modalOverlayRef = useRef<HTMLDivElement>(null);
	let imageUploadRef = useRef<HTMLInputElement>(null);
  let loadImageButtonRef = useRef<HTMLButtonElement>(null);

	const currentEntry = useLiveQuery(
		() => db.entries.get(globalState.currentEntryId)
	, [globalState]);

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
				<h1>Mark Image</h1>
				<p>Updating entry with id = { globalState.currentEntryId }.</p>
				<div className="imageContainer" style={{background: "url: data("+currentEntry?.image+")"}}>
				</div>
				<button type="button" onClick={ () => setIsModalVisible(false) }>Close</button>
			</div>
    </div>
  );
}

export default MarkImageModal;
