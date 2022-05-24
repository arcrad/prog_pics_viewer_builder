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
	} 
from 'react';
import {
	useNavigate,
} from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';

import { db, Entry } from './db';
import { GlobalState } from './App';
import ChangeImageComponent from './ChangeImageComponent';

import styles from './ChangeImageModal.module.css';

type ChangeImageModalAttributes= {
	//globalState: GlobalState,
	//setGlobalState: Dispatch<SetStateAction<GlobalState>>,
//	isModalVisible: boolean,
//	setIsModalVisible: Dispatch<SetStateAction<boolean>>,
};

function ChangeImageModal({
//	globalState, 
//	setGlobalState,
//	isModalVisible,
//	setIsModalVisible,
} : ChangeImageModalAttributes ) {
	let [statusMessages, setStatusMessages] = useState<string[]>([]);
	
	let modalOverlayRef = useRef<any>(null);

	let navigate = useNavigate();

	/*useEffect( () => {
		if(modalOverlayRef.current) {
			isModalVisible ? 
				modalOverlayRef.current.classList.add("modalVisible")
				:
				modalOverlayRef.current.classList.remove("modalVisible");
		}

	}, [isModalVisible]);*/
	
	/*useEffect( () => {
		if(modalOverlayRef.current) {
			isModalVisible ? 
				//modalOverlayRef.current.classList.add("modalVisible")
				modalOverlayRef.current.showModal()
				:
				modalOverlayRef.current.close();
				//modalOverlayRef.current.classList.remove("modalVisible");
		}
	}, [isModalVisible]);*/
	
	useEffect( () => {
		if(modalOverlayRef.current && !modalOverlayRef.current.open) {
				modalOverlayRef.current.showModal();
		}
	}, []);
	
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
			navigate('../');
			//setIsLoaded(false);
		//	setIsModalVisible(false);
	};

	return (
    <dialog ref={modalOverlayRef} className={styles.modalOverlay1}>
			<div className={styles.controlsContainer}>
				<h2>Change Image</h2>
				<ChangeImageComponent
					closeModalOnLoad={true}
				/>
				<button type="button" onClick={handleCloseButton}>Cancel</button>
			</div>
    </dialog>
  );
}

export default ChangeImageModal;
