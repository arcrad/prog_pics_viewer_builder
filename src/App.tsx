import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import './App.css';
import Entry from './Entry';
import Viewer from './Viewer';
import Export from './Export';
import Settings from './Settings';
import ImageStorePOC from './ImageStorePOC';
import Builder from './Builder';

export type GlobalState = {
	currentEntryId: number
};

function App() {
	let [globalState, setGlobalState] = useState<GlobalState>({ currentEntryId: 123});

  return (
    <div className="App">
		<BrowserRouter>
			<Routes>
    		<Route path="/" element={<Builder />}>
					<Route 
						path="entry" 
						element={
							<Entry 
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
