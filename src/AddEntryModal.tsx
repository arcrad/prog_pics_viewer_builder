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
	BrowserRouter, 
	Routes, 
	Route, 
	NavLink, 
	useNavigate 
} from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';

import { db, Entry } from './db';
import { GlobalState } from './App';
import './AddEntryModal.css';
import ChangeImageComponent from './ChangeImageComponent';
import MarkImageComponent from './MarkImageComponent';
import UpdateEntryDataComponent from './UpdateEntryDataComponent';

type AddEntryModalAttributes = {
	globalState: GlobalState,
	setGlobalState: Dispatch<SetStateAction<GlobalState>>,
	isModalVisible: boolean,
	setIsModalVisible: Dispatch<SetStateAction<boolean>>,
};

function AddEntryModal({
	globalState, 
	setGlobalState,
	isModalVisible,
	setIsModalVisible,
} : AddEntryModalAttributes ) {
	let [isLoaded, setIsLoaded] = useState(false);
	
	const modalOverlayRef = useRef<any>(null);

	const navigate = useNavigate();

	const currentEntry = useLiveQuery(
		() => db.entries.get(globalState.currentEntryId)
	, [globalState]);

	

	/*
	useEffect( () => {
		function updateResizeCanary() {
			setResizeCanary( (cs) => !cs );
		}
		window.addEventListener('resize', updateResizeCanary);
		return( () => {
			window.removeEventListener('resize', updateResizeCanary);
		});

	}, []);
	*/
	
	const addEntry = async () => {
		//console.dir(imageUploadRef.current);
		console.log("addEntry() called");
		try {
			const date = ((new Date()).toISOString()).substring(0, 16); 
			//datetime needs to be more robust
			const id = await db.entries.add({
				date: date,
				draft: true
			});
			console.log( 'new id =', id);
			setGlobalState( (cs):GlobalState => {
				console.log('inner id=',id);
				let ns = { currentEntryId: id as number};
				return { ...cs, ...ns };
			});
		} catch(error) {
			console.error(`failed to add db entry. ${error}`);
		}
	};

	useEffect( () => {
		if(isModalVisible) {
			addEntry();
			navigate('/entry/add/image');
		}
	}, [isModalVisible]);

	/*useEffect( () => {
		if(modalOverlayRef.current) {
			isModalVisible ? 
				modalOverlayRef.current.classList.add("modalVisible")
				:
				modalOverlayRef.current.classList.remove("modalVisible");
		}

	}, [isModalVisible]);*/
	
	useEffect( () => {
		if(modalOverlayRef.current) {
			isModalVisible ? 
				//modalOverlayRef.current.classList.add("modalVisible")
				modalOverlayRef.current.showModal()
				:
				modalOverlayRef.current.close();
				//modalOverlayRef.current.classList.remove("modalVisible");
		}
	}, [isModalVisible]);
	
	useEffect( () => {
		if(modalOverlayRef.current) {
			modalOverlayRef.current.addEventListener('close', handleCloseButton);
			modalOverlayRef.current.addEventListener('cancel', handleCloseButton);
		}
		return () => {
			if(modalOverlayRef.current) {
				modalOverlayRef.current.removeEventListener('close', handleCloseButton);
				modalOverlayRef.current.removeEventListener('cancel', handleCloseButton);
			}
		}
	}, []);

	let closeModal = () => {
		setIsLoaded(false);
		setIsModalVisible(false);
	}

	let handleCloseButton = async () => {
		console.log('handleCloseButton()');
		console.log('attempt to delete current draft entry');
		try {
			const numberDeleted = await db.entries
				.where("id").equals(globalState.currentEntryId)
				.delete();
			console.log(`Successfully deleted ${numberDeleted} records.`);
		} catch(error) {
			console.error(`encountered error trying to delete record with id = ${globalState.currentEntryId}`);
		}
		closeModal();
	};

	let handleSaveButton = () => {
		db.entries.update(globalState.currentEntryId, {
			draft: false
		});
		closeModal();
	};

	return (
    <dialog ref={modalOverlayRef} className="modalOverlay1">
			<div className="addEntryContentContainer">
				<div className="main">
					<h2>Add Entry</h2>
					<p>Updating entry with id = { globalState.currentEntryId }</p>
					<NavLink to="./add/image" className="addEntryStepLink">Change Image</NavLink>
					&gt;
					<NavLink to="./add/mark" className="addEntryStepLink">Mark Image</NavLink>
					&gt;
					<NavLink to="./add/updateinfo" className="addEntryStepLink">Update Data</NavLink>
					<Routes>
						<Route path="/add/image" element={
							<ChangeImageComponent
								globalState={globalState} 
								setGlobalState={setGlobalState} 
								isModalVisible={isModalVisible}
								setIsModalVisible={setIsModalVisible}
								closeModalOnLoad={false}
								afterLoadImageFn={ () => { navigate("./add/mark") }}
							/>
						} />
						<Route path="/add/mark" element={
							<MarkImageComponent
								globalState={globalState} 
								setGlobalState={setGlobalState} 
								isModalVisible={isModalVisible}
								setIsModalVisible={setIsModalVisible}
								isLoaded={isLoaded}
								setIsLoaded={setIsLoaded}
							/>
						} />
						<Route path="/add/updateinfo" element={
							<UpdateEntryDataComponent
								globalState={globalState} 
								setGlobalState={setGlobalState} 
								isModalVisible={isModalVisible}
								setIsModalVisible={setIsModalVisible}
								afterUpdateFn={ () => {}}
							/>
						} />
					</Routes>
				</div>
				<hr/>
				<div className="footer">
					<button 
						type="button" 
						className="saveButton"
						onClick={ handleSaveButton }
					>
							Save
					</button>
					<button 
						type="button" 
						className="closeButton"
						onClick={ handleCloseButton }
					>
							Cancel
					</button>
				</div>
			</div>
    </dialog>
  );
}

export default AddEntryModal;
