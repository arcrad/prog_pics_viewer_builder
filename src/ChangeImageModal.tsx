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
	
	let modalOverlayRef = useRef<HTMLDivElement>(null);

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
			<div className="controlsContainer">
				<ChangeImageComponent
					globalState={globalState} 
					setGlobalState={setGlobalState} 
					isModalVisible={isModalVisible}
					setIsModalVisible={setIsModalVisible}
				/>
				<button type="button" onClick={ () => setIsModalVisible(false) }>Cancel</button>
			</div>
    </div>
  );
}

export default ChangeImageModal;
