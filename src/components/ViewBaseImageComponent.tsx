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
	useParams
} from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
	faCrosshairs, 
	faLocationCrosshairs, 
} from '@fortawesome/free-solid-svg-icons'

import { db, Entry } from '../db';
//import { GlobalState } from './App';

import styles from './ViewBaseImageComponent.module.css';

type ViewBaseImageComponentAttributes = {
	isLoaded: boolean,
	setIsLoaded: Dispatch<SetStateAction<boolean>>,
};

function ViewBaseImageComponent({
	isLoaded,
	setIsLoaded
} : ViewBaseImageComponentAttributes ) {
	let [currentEntry, setCurrentEntry] = useState<Entry|null>(null);

	let { entryId } = useParams();
	
	useEffect( () => {
		if(entryId == null) {
			return;
		}
		Promise.all([
			db.entries.get(parseInt(entryId))
		]).then(([
			_currentEntry
		]) => {
			if(_currentEntry) {
				setCurrentEntry(_currentEntry);
			}
		});
	}, [entryId])

	return (
		<>
			{
				currentEntry == null &&
				<div>
					Loading image...
				</div>
			}
			{
				currentEntry !== null &&
				<div className={styles.imageContainer}>
					<img 
						src={currentEntry !== null ? URL.createObjectURL(new Blob([currentEntry.imageBlob.buffer])) : ''}
						className={styles.image}
					/>
				</div>
			}
		</>
  );
}

export default ViewBaseImageComponent;
