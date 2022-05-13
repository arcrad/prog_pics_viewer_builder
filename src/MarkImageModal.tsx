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
import MarkImageComponent from './MarkImageComponent';
import './MarkImageModal.css';

type MarkImageModalAttributes = {
	globalState: GlobalState,
	setGlobalState: Dispatch<SetStateAction<GlobalState>>,
	isModalVisible: boolean,
	setIsModalVisible: Dispatch<SetStateAction<boolean>>,
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
	isModalVisible,
	setIsModalVisible,
} : MarkImageModalAttributes ) {
	let [isLoaded, setIsLoaded] = useState(false);

	const modalOverlayRef = useRef<HTMLDivElement>(null);

	useEffect( () => {
		if(modalOverlayRef.current) {
			isModalVisible ? 
				modalOverlayRef.current.classList.add("modalVisible")
				:
				modalOverlayRef.current.classList.remove("modalVisible");
		}

	}, [isModalVisible]);

	let handleCloseButton = () => {
			setIsLoaded(false);
			setIsModalVisible(false);
	};

	return (
    <div ref={modalOverlayRef} className="modalOverlay">
			<div className="contentContainer">
				<MarkImageComponent
					globalState={globalState} 
					setGlobalState={setGlobalState} 
					isModalVisible={isModalVisible}
					setIsModalVisible={setIsModalVisible}
					isLoaded={isLoaded}
					setIsLoaded={setIsLoaded}
				/>
				<div>
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

export default MarkImageModal;
