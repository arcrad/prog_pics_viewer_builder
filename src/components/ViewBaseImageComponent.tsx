import 
	React, 
	{ 
		useState, 
		useEffect, 
		Dispatch, 
		SetStateAction, 
	} from 'react';
import {
	useParams
} from 'react-router-dom';

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
						alt="Image for current entry."
					/>
				</div>
			}
		</>
  );
}

export default ViewBaseImageComponent;
