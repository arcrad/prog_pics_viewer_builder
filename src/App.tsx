import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';

import { db, Entry } from './db';
import './App.css';
import EntryComponent from './Entry';
import Viewer from './Viewer';
import Export from './Export';
import Settings from './Settings';
import ImageStorePOC from './ImageStorePOC';
import Builder from './Builder';

export type GlobalState = {
	currentEntryId: number
};

function App() {
	let [globalState, setGlobalState] = useState<GlobalState>({ currentEntryId: 0 });

	/*const entries = useLiveQuery(
		() => db.entries.toArray()
	);*/
	
	useEffect( () => {
		console.log('app initialize currentEntryId');
		async function initializeCurrentEntryId() {
			const entries = await db.entries.toArray();
			setGlobalState( (cs):GlobalState => {
				console.log(JSON.stringify(cs));
				if(entries) {
					let ns = { currentEntryId: entries[0].id || 0 };
					return {...cs, ...ns};
				}
				return cs;
			});
		}
		initializeCurrentEntryId();
	}, []);

  return (
    <div className="App">
		<BrowserRouter>
			<Routes>
    		<Route path="/" element={<Builder />}>
					<Route 
						path="entry" 
						element={
							<EntryComponent
								globalState={globalState} 
								setGlobalState={setGlobalState}
							/>
						} 
					/>
					<Route 
						path="viewer" 
						element={
							<Viewer
								globalState={globalState} 
								setGlobalState={setGlobalState}
							/>
						}
					/>
					<Route path="export" element={<Export />} />
					<Route path="settings" element={<Settings />} />
				</Route>
			</Routes>
		</BrowserRouter>
    </div>
  );
}

export default App;
