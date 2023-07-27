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

import { db, Entry, Setting } from '../db';
import { GlobalState } from '../App';

import styles from './SetupModal.module.css';

type SetupModalAttributes= {
	globalState: GlobalState,
	setGlobalState: Dispatch<SetStateAction<GlobalState>>,
	isModalVisible: boolean,
	setIsModalVisible: Dispatch<SetStateAction<boolean>>,
};

function SetupModal({
	globalState, 
	setGlobalState,
	isModalVisible,
	setIsModalVisible,
} : SetupModalAttributes ) {
	let [loadedData, setLoadedData] = useState(false);
	let [workingDirectoryHandle, setWorkingDirectoryHandle] = useState<any | null>(null);

	let initializedRef = useRef(false);
	let modalOverlayRef = useRef<HTMLDivElement>(null);
	//let imageUploadRef = useRef<HTMLInputElement>(null);
  let selectWorkingDirectoryButtonRef = useRef<HTMLButtonElement>(null);

	useEffect( () => {
		if(initializedRef.current) {
			return;
		}
		initializedRef.current = true;
		console.log('initializing...');
		Promise.all([
			db.settings.get('workingDirectoryHandle')
		]).then( ([
			_workingDirectoryHandle
		]) => {
			if(_workingDirectoryHandle) {
				setWorkingDirectoryHandle(_workingDirectoryHandle.value);
				console.dir(_workingDirectoryHandle.value);
			}
			setLoadedData(true);
		});
	}, []);

	/*const loadImageHandler = async (event:MouseEvent<HTMLButtonElement>) => {
		//console.dir(imageUploadRef.current);
		console.log("handle load image..");
		let selectedFile;
		if(imageUploadRef.current && imageUploadRef.current.files) {
			selectedFile = imageUploadRef.current.files[0];
			console.log('selected file objectURL=');
			console.dir(URL.createObjectURL(selectedFile));
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
	};*/

	const selectWorkingDirectoryHandler = async (event:MouseEvent<HTMLButtonElement>) => {
		console.log('selectWorkingDirectoryHandler() called');
	  const directoryHandle = await window.showDirectoryPicker();
		console.log('directoryHandle = ');
		console.dir(directoryHandle);
		console.log('update directoryHandle in db');
		try {
			const id = await db.settings.put(
				{ key: "workingDirectoryHandle", value: directoryHandle }
			);
			console.log(`id = ${id}`);
		} catch(error) {
			console.error(`failed to add db entry. ${error}`);
		}
	};

	useEffect( () => {
		if(modalOverlayRef.current) {
			isModalVisible ? 
				modalOverlayRef.current.classList.add(styles.modalVisible)
				:
				modalOverlayRef.current.classList.remove(styles.modalVisible);
		}

	}, [isModalVisible]);

	return (
    <div ref={modalOverlayRef} className={styles.modalOverlay}>
			<div className={styles.controlsContainer}>
				{ 
					!loadedData && 
					<div>
						<h1>LOADING...</h1>
					</div> 
				}
				{ 
					loadedData &&
					<div> 
				<h1>Setup</h1>
				<h2>Filesystem</h2>
				<p>Configure directory for data storage</p>
				<p>Current working directory: {workingDirectoryHandle?.name }</p>
				<button ref={selectWorkingDirectoryButtonRef} type="button" onClick={selectWorkingDirectoryHandler}>
					Select Working Directory
				</button>
				<hr />
					</div>
				}
				<button type="button" onClick={ () => setIsModalVisible(false) }>Close</button>
			</div>
    </div>
  );
}

export default SetupModal;
