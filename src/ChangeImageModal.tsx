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
		document.documentElement.classList.add('is-clipped');
		return () => {
			document.documentElement.classList.remove('is-clipped');
		}
	}, []);
	
	let handleCloseButton = () => {
			console.log('handleCloseButton()');
			navigate('../');
			//setIsLoaded(false);
		//	setIsModalVisible(false);
	};

	return (
    <div ref={modalOverlayRef} className="modal is-active">
			<div className="modal-background">
			</div>
			<div className="modal-card">
				<div className={`modal-card-head`}>
					<h1 className="modal-card-title">Change Image</h1>
				</div>
				<div className={`modal-card-body ${styles.main}`}>
					<ChangeImageComponent
						closeModalOnLoad={true}
					/>
				</div>
				<div className="modal-card-foot">
					<button 
						type="button" 
						className="button"
						onClick={ handleCloseButton }
					>
							Close
					</button>
				</div>
			</div>
    </div>
  );
}

export default ChangeImageModal;
