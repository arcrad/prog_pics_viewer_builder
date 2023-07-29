import 
	React, 
	{ 
		useState, 
		useEffect, 
		useRef, 
		Dispatch, 
		SetStateAction, 
	} from 'react';
import {
	useNavigate,
} from 'react-router-dom';

//import { db, Entry } from '../db';
import { GlobalState } from '../App';
import MarkImageComponent from './MarkImageComponent';

//import styles from './MarkImageModal.module.css';

type MarkImageModalAttributes = {
	globalState: GlobalState,
	setGlobalState: Dispatch<SetStateAction<GlobalState>>,
//	isModalVisible: boolean,
//	setIsModalVisible: Dispatch<SetStateAction<boolean>>,
};

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

/*	useEffect( () => {
		if(modalOverlayRef.current && !modalOverlayRef.current.open) {
				modalOverlayRef.current.showModal();
		}
	}, []);
	*/

	useEffect( () => {
		document.documentElement.classList.add('is-clipped');
		return () => {
			document.documentElement.classList.remove('is-clipped');
		}
	}, []);

	/*
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
	*/

	let handleCloseButton = () => {
			console.log('handleCloseButton()');
			setIsLoaded(false);
			navigate('../');
		//	setIsModalVisible(false);
	};

	return (
    <div ref={modalOverlayRef} className="modal is-active">
			<div className="modal-background">
			</div>
			<div className="modal-card">
				<div className={`modal-card-head`}>
					<h1 className="modal-card-title">Mark Image</h1>
				</div>
				<div className={`modal-card-body`}>
					<MarkImageComponent
						globalState={globalState} 
						setGlobalState={setGlobalState} 
						isLoaded={isLoaded}
						setIsLoaded={setIsLoaded}
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

export default MarkImageModal;
