import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import './App.css';
import Entry from './Entry';
import Viewer from './Viewer';
import Export from './Export';
import Settings from './Settings';
import ImageStorePOC from './ImageStorePOC';
import Builder from './Builder';

function App() {
	let [currentEntryId, setCurrentEntryId] = useState(0);

  return (
    <div className="App">
		<BrowserRouter>
			<Routes>
    		<Route path="/" element={<Builder />}>
					<Route path="entry" element={<Entry currentEntryId={currentEntryId} setCurrentEntryId={setCurrentEntryId}/>} />
					<Route path="viewer" element={<Viewer />} />
					<Route path="export" element={<Export />} />
					<Route path="settings" element={<Settings />} />
				</Route>
			</Routes>
		</BrowserRouter>
    </div>
  );
}

export default App;
