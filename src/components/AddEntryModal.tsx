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
	BrowserRouter, 
	Routes, 
	Route, 
	NavLink, 
	useNavigate,
	useParams
} from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
	fa1,
	fa2,
	fa3,
} from '@fortawesome/free-solid-svg-icons'


import { db, Entry } from '../db';
import { GlobalState } from '../App';
import ChangeImageComponent from './ChangeImageComponent';
import MarkImageComponent from './MarkImageComponent';
import UpdateEntryDataComponent from './UpdateEntryDataComponent';
import { EntryValidationErrorsList } from '../Common';

import styles from './AddEntryModal.module.scss';

type AddEntryModalAttributes = {
	globalState: GlobalState,
	setGlobalState: Dispatch<SetStateAction<GlobalState>>,
};

function AddEntryModal({
	globalState, 
	setGlobalState,
} : AddEntryModalAttributes ) {
	let [isLoaded, setIsLoaded] = useState(false);
	let [modalIsLoaded, setModalIsLoaded] = useState(false);

	const modalOverlayRef = useRef<any>(null);

	const navigate = useNavigate();
	const { entryId } = useParams();

	const currentEntry = useLiveQuery(
		() => {
			const sanitizedEntryId = parseInt(entryId || '0');
			//console.log(`within useLiveQuery, entryId = ${sanitizedEntryId}`);
			return db.entries.get(sanitizedEntryId)
		}
	, [entryId]);

	/*	
	const addEntry = async () => {
		//console.dir(imageUploadRef.current);
		console.log("addEntry() called");
		try {
			const date = ((new Date()).toISOString()).substring(0, 16) + ':00Z'; 
			//datetime needs to be more robust
			const id = await db.entries.add({
				date: date,
				draft: true
			});
			console.log( 'new id =', id);
			setGlobalState( (cs):GlobalState => {
				console.log('inner id=',id);
				let ns = { currentEntryId: id as number};
				return { ...cs, ...ns };
			});
		} catch(error) {
			console.error(`failed to add db entry. ${error}`);
		}
	};
	*/

	useEffect( () => {
		document.documentElement.classList.add('is-clipped');
		return () => {
			document.documentElement.classList.remove('is-clipped');
		}
	}, []);

	useEffect( () => {
		console.warn('current entry has changed!');
		console.dir(currentEntry);
	}, [currentEntry]);


	let closeModal = () => {
		setIsLoaded(false);
		navigate('..');
	}

	let handleCancelButton = async () => {
		console.log('handleCancelButton()');
		console.log('attempt to delete current draft entry');
		try {
			if(entryId != null) {
				const currentEntry = await db.entries.get(parseInt(entryId));
				//console.dir(currentEntry);
				if(currentEntry && currentEntry.draft) {
					const numberDeleted = await db.entries
						.where("id").equals(parseInt(entryId))
						.delete();
					console.log(`Successfully deleted ${numberDeleted} records.`);
				} else {
					console.log('entry is not draft, so not deleting');
				}
			}
		} catch(error) {
			console.error(`encountered error trying to delete record with id = ${entryId}`);
		}
		closeModal();
	};

	let handleSaveButton = () => {
		if(entryId != null) {
			db.entries.update(parseInt(entryId), {
				includeInExport: true,
				draft: false
			});
		}
		closeModal();
	};

	return (
    <div ref={modalOverlayRef} className="modal is-active">
			<div className="modal-background">
			</div>
			<div className="modal-card">
				<div className={`modal-card-head`}>
					<h1 className="modal-card-title">Add Entry</h1>
				</div>
				<div className={`modal-card-body ${styles.main}`}>
					{/*<p>currentEntry = {JSON.stringify(currentEntry)}</p>*/}
					{/*<p>Updating entry with entryId = {entryId}</p>*/}
					<div className="tabs is-centered is-toggle is-toggle-rounded is-boxed">
					  <ul>
							<li>
								<NavLink to="./image" className={styles.addEntryStepLink}>
									<span className="icon">
										<FontAwesomeIcon icon={fa1}/>
									</span>
									<span>Change Image</span>
								</NavLink>
							</li>
							<li>
								<NavLink to="./mark" className={styles.addEntryStepLink}>
									<span className="icon">
										<FontAwesomeIcon icon={fa2}/>
									</span>
									<span>Mark Image</span>
								</NavLink>
							</li>
							<li>
								<NavLink to="./updateinfo" className={styles.addEntryStepLink}>
									<span className="icon">
										<FontAwesomeIcon icon={fa3}/>
									</span>
									<span>Update Data</span>
								</NavLink>
							</li>
						</ul>
					</div>
					<Routes>
						<Route path="/image" element={
							<ChangeImageComponent
								closeModalOnLoad={false}
								afterLoadImageFn={ () => { navigate("./mark") }}
							/>
						} />
						<Route path="/mark" element={
							<MarkImageComponent
								globalState={globalState} 
								setGlobalState={setGlobalState} 
								isLoaded={isLoaded}
								setIsLoaded={setIsLoaded}
							/>
						} />
						<Route path="/updateinfo" element={
							<UpdateEntryDataComponent
								afterUpdateFn={ () => {}}
							/>
						} />
					</Routes>
					<div>
						{ 
							currentEntry ? 
								<>
									<hr/>
									<EntryValidationErrorsList 
										entry={currentEntry} 
										showIsValid={true}
										hideAlignedImageError={true}
									/>
								</>
								:
								''
						}
					</div>
				</div>
				<div className="modal-card-foot">
					<button 
						type="button" 
						className="button is-primary"
						onClick={ handleSaveButton }
					>
							Save Entry
					</button>
					<button 
						type="button" 
						className="button"
						onClick={ handleCancelButton }
					>
							Cancel
					</button>
				</div>
			</div>
    </div>
  );
}

export default AddEntryModal;
