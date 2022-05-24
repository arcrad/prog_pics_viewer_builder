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
	useNavigate,
	useParams
} from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';

import { db, Entry } from './db';
import { GlobalState } from './App';
import ChangeImageComponent from './ChangeImageComponent';
import MarkImageComponent from './MarkImageComponent';
import UpdateEntryDataComponent from './UpdateEntryDataComponent';

import styles from './AddEntryModal.module.css';

type AddEntryModalAttributes = {
	globalState: GlobalState,
	setGlobalState: Dispatch<SetStateAction<GlobalState>>,
//	isModalVisible: boolean,
//	setIsModalVisible: Dispatch<SetStateAction<boolean>>,
};

function AddEntryModal({
	globalState, 
	setGlobalState,
//	isModalVisible,
//	setIsModalVisible,
} : AddEntryModalAttributes ) {
	let [isLoaded, setIsLoaded] = useState(false);
	let [modalIsLoaded, setModalIsLoaded] = useState(false);

	const modalOverlayRef = useRef<any>(null);

	const navigate = useNavigate();
	const { entryId } = useParams();

	const currentEntry = useLiveQuery(
		() => db.entries.get(entryId || 0)
	, [entryId]);

	

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

/*	useEffect( () => {
		if(isModalVisible) {
			addEntry();
			navigate('/entry/add/image');
		}
	}, [isModalVisible]);
*/

/*
	useEffect( () => {
		if(modalOverlayRef.current.open) {
			addEntry();
			//navigate('/entry/add/image');
		}
	}, []);
*/

	/*useEffect( () => {
		if(modalOverlayRef.current) {
			isModalVisible ? 
				modalOverlayRef.current.classList.add("modalVisible")
				:
				modalOverlayRef.current.classList.remove("modalVisible");
		}

	}, [isModalVisible]);*/
	
	useEffect( () => {
		if(modalOverlayRef.current && !modalOverlayRef.current.open) {
				modalOverlayRef.current.showModal();
		}
	}, []);

/*	useEffect( () => {
		if(modalOverlayRef.current) {
			isModalVisible ? 
				//modalOverlayRef.current.classList.add("modalVisible")
				modalOverlayRef.current.showModal()
				:
				modalOverlayRef.current.close();
				//modalOverlayRef.current.classList.remove("modalVisible");
		}
	}, [isModalVisible]);
	*/

	useEffect( () => {
		if(modalOverlayRef.current) {
			modalOverlayRef.current.addEventListener('close', handleCancelButton);
			modalOverlayRef.current.addEventListener('cancel', handleCancelButton);
		}
		return () => {
			if(modalOverlayRef.current) {
				modalOverlayRef.current.removeEventListener('close', handleCancelButton);
				modalOverlayRef.current.removeEventListener('cancel', handleCancelButton);
			}
		}
	}, []);

	let closeModal = () => {
		setIsLoaded(false);
		navigate('/entry');
	//	setIsModalVisible(false);
	}

	let handleCancelButton = async () => {
		console.log('handleCancelButton()');
		console.log('attempt to delete current draft entry');
		try {
			if(entryId != null) {
				const currentEntry = await db.entries.get(parseInt(entryId));
				//console.dir(currentEntry);
				if(currentEntry && currentEntry.draft) {
					const numberDeleted = await db.entries
						.where("id").equals(parseInt(entryId))
						.delete();
					console.log(`Successfully deleted ${numberDeleted} records.`);
				} else {
					console.log('entry is not draft, so not deleting');
				}
			}
		} catch(error) {
			console.error(`encountered error trying to delete record with id = ${entryId}`);
		}
		closeModal();
	};

	let handleSaveButton = () => {
		if(entryId != null) {
			db.entries.update(parseInt(entryId), {
				draft: false
			});
		}
		closeModal();
	};

    //<dialog ref={modalOverlayRef} className="modalOverlay1" open={true}>
	return (
    <dialog ref={modalOverlayRef} className={styles.modalOverlay1}>
			<div className={styles.addEntryContentContainer}>
				<div className={styles.main}>
					<h2>Add Entry</h2>
					<p>Updating entry with entryId = {entryId}</p>
					<NavLink to="./image" className={styles.addEntryStepLink}>Change Image</NavLink>
					&gt;
					<NavLink to="./mark" className={styles.addEntryStepLink}>Mark Image</NavLink>
					&gt;
					<NavLink to="./updateinfo" className={styles.addEntryStepLink}>Update Data</NavLink>
					<Routes>
						<Route path="/image" element={
							<ChangeImageComponent
								closeModalOnLoad={false}
								afterLoadImageFn={ () => { navigate("./mark") }}
							/>
						} />
						<Route path="/mark" element={
							<MarkImageComponent
								globalState={globalState} 
								setGlobalState={setGlobalState} 
								isLoaded={isLoaded}
								setIsLoaded={setIsLoaded}
							/>
						} />
						<Route path="/updateinfo" element={
							<UpdateEntryDataComponent
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
							Save Entry
					</button>
					<button 
						type="button" 
						className="closeButton"
						onClick={ handleCancelButton }
					>
							Cancel
					</button>
				</div>
			</div>
    </dialog>
  );
}

export default AddEntryModal;
