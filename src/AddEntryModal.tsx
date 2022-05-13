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

	let handleCloseButton = () => {
			setIsLoaded(false);
			setIsModalVisible(false);
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
			<div className="contentContainer">
				<div className="main">
					<h2>Add Entry</h2>
					<p>Updating entry with id = { globalState.currentEntryId }</p>
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
