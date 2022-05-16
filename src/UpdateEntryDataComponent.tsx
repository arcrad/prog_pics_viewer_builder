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
//import './UpdateEntryDataComponent.css';

type UpdateEntryDataComponentAttributes= {
	globalState: GlobalState;
	setGlobalState: Dispatch<SetStateAction<GlobalState>>;
	isModalVisible: boolean;
	setIsModalVisible: Dispatch<SetStateAction<boolean>>;
	afterUpdateFn?: () => void;
};

function UpdateEntryDataComponent({
	globalState, 
	setGlobalState,
	isModalVisible,
	setIsModalVisible,
	afterUpdateFn,
} : UpdateEntryDataComponentAttributes ) {
	let [statusMessages, setStatusMessages] = useState<string[]>([]);
	
	return (
			<>
				<h1>Update Entry Data</h1>
				<p>Updating entry with id = { globalState.currentEntryId }.</p>
				<button type="button">
					Save
				</button>
			</>
  );
}

export default UpdateEntryDataComponent;
