import React, { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Outlet, Link } from 'react-router-dom';

import { db, Entry } from './db';
import { GlobalState } from './App';
import SetupModal from './SetupModal';

type BuilderAttributes= {
	globalState: GlobalState;
	setGlobalState: Dispatch<SetStateAction<GlobalState>>;
};

function Builder({
	globalState,
	setGlobalState
} : BuilderAttributes) {
	let [setupModalIsVisible, setSetupModalIsVisible] = useState(false);

	const initializedRef = useRef(false);

	//displays setup modal if setting(s) arent found
	/* temporarily disabled
	useEffect( () => {
		if(initializedRef.current) {
			return;
		}
		initializedRef.current = true;
		Promise.all([
			db.settings.get('workingDirectoryHandle')
		]).then( ([
			_workingDirectoryHandle
		]) => {
			if(_workingDirectoryHandle) {
			} else {
				setSetupModalIsVisible(true);
			}
			//setLoadedData(true);
		});
	}, []);*/

	return (
		<div>
			<h1>Builder</h1>
			<nav style={{
				display: "flex",
				flexDirection: "row",
				justifyContent: "space-around",
				alignItems: "center",
				border: "1px solid red",
				padding: "1rem"
			}}>
				<Link to="/entry">Entry</Link>
				<Link to="/adjust">Adjust</Link>
				<Link to="/viewer">Viewer</Link>
				<Link to="/export">Export</Link>
				<Link to="/settings">Settings</Link>
			</nav>
			<Outlet />
			<SetupModal 
					globalState={globalState} 
					setGlobalState={setGlobalState} 
					isModalVisible={setupModalIsVisible}
					setIsModalVisible={setSetupModalIsVisible}
				/>
		</div>
	);
}

export default Builder;
