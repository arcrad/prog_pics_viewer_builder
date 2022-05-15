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
import { useLiveQuery } from 'dexie-react-hooks';

import { db, Entry } from './db';
import { GlobalState } from './App';
import './AddEntryModal.css';
import ChangeImageComponent from './ChangeImageComponent';
import MarkImageComponent from './MarkImageComponent';

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

	const modalOverlayRef = useRef<HTMLDivElement>(null);

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
				date
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

	let handleCloseButton = () => {
			setIsLoaded(false);
			setIsModalVisible(false);
	};
	
	useEffect( () => {
		if(isModalVisible) {
			addEntry();
		}
	}, [isModalVisible]);

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
			<div className="addEntryContentContainer">
				<div className="main">
					<h2>Add Entry</h2>
					<p>Updating entry with id = { globalState.currentEntryId }</p>
					<ChangeImageComponent
						globalState={globalState} 
						setGlobalState={setGlobalState} 
						isModalVisible={isModalVisible}
						setIsModalVisible={setIsModalVisible}
						closeModalOnLoad={false}
					/>
					<MarkImageComponent
						globalState={globalState} 
						setGlobalState={setGlobalState} 
						isModalVisible={isModalVisible}
						setIsModalVisible={setIsModalVisible}
						isLoaded={isLoaded}
						setIsLoaded={setIsLoaded}
					/>
				</div>
				<div className="footer">
					<button 
						type="button" 
						className="closeButton"
						onClick={ handleCloseButton }
					>
							Close
					</button>
				</div>
			</div>
    </div>
  );
}

export default AddEntryModal;
