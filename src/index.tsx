import React from 'react';
import ReactDOM from 'react-dom/client';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import './index.css';
import App from './App';
import Entry from './Entry';
import Viewer from './Viewer';
import Export from './Export';
import Settings from './Settings';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
		<BrowserRouter>
			<Routes>
    		<Route path="/" element={<App />}>
					<Route path="entry" element={<Entry />} />
					<Route path="viewer" element={<Viewer />} />
					<Route path="export" element={<Export />} />
					<Route path="settings" element={<Settings />} />
				</Route>
			</Routes>
		</BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
