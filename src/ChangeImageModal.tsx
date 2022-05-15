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
import ChangeImageComponent from './ChangeImageComponent';
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
	let [statusMessages, setStatusMessages] = useState<string[]>([]);
	
	let modalOverlayRef = useRef<any>(null);

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

	let handleCloseButton = () => {
			console.log('handleCloseButton()');
			//setIsLoaded(false);
			setIsModalVisible(false);
	};

	return (
    <dialog ref={modalOverlayRef} className="modalOverlay1">
			<div className="controlsContainer">
				<ChangeImageComponent
					globalState={globalState} 
					setGlobalState={setGlobalState} 
					isModalVisible={isModalVisible}
					setIsModalVisible={setIsModalVisible}
					closeModalOnLoad={true}
				/>
				<button type="button" onClick={handleCloseButton}>Cancel</button>
			</div>
    </dialog>
  );
}

export default ChangeImageModal;
