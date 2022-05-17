import React, { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Outlet, NavLink } from 'react-router-dom';

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
				<NavLink to="/entry">Entry</NavLink>
				<NavLink to="/adjust">Adjust</NavLink>
				<NavLink to="/process">Process</NavLink>
				<NavLink to="/export">Export</NavLink>
				<NavLink to="/settings">Settings</NavLink>
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
