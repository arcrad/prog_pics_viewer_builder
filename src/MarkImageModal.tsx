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
	useNavigate,
} from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';

import { db, Entry } from './db';
import { GlobalState } from './App';
import MarkImageComponent from './MarkImageComponent';

import styles from './MarkImageModal.module.css';

type MarkImageModalAttributes = {
	globalState: GlobalState,
	setGlobalState: Dispatch<SetStateAction<GlobalState>>,
//	isModalVisible: boolean,
//	setIsModalVisible: Dispatch<SetStateAction<boolean>>,
};

type MarkPoint = {
	x: number,
	y: number,
	fillStyle: string
}

type Marks = {
	[key:string]: MarkPoint
}

type MarkFillStyles = {
	[key: string]: string
}

const markFillStyles:MarkFillStyles = {
	'A': 'red',
	'B': 'green',
	'C': 'blue'
}

function MarkImageModal({
	globalState, 
	setGlobalState,
//	isModalVisible,
//	setIsModalVisible,
} : MarkImageModalAttributes ) {
	let [isLoaded, setIsLoaded] = useState(false);

	//const modalOverlayRef = useRef<HTMLDialogElement>(null);
	const modalOverlayRef = useRef<any>(null);

	const navigate = useNavigate();

/*	useEffect( () => {
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
			setIsLoaded(false);
			navigate('/entry');
		//	setIsModalVisible(false);
	};

	return (
    <dialog ref={modalOverlayRef} className={styles.modalOverlay1}>
			<div className={styles.contentContainer}>
				<MarkImageComponent
					globalState={globalState} 
					setGlobalState={setGlobalState} 
					isLoaded={isLoaded}
					setIsLoaded={setIsLoaded}
				/>
				<div>
				<button 
					type="button" 
					className={styles.closeButton}
					onClick={ handleCloseButton }
				>
						Close
				</button>
				</div>
			</div>
    </dialog>
  );
}

export default MarkImageModal;
