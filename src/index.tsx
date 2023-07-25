import React from 'react';
import ReactDOM from 'react-dom/client';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import App from './App';

//import './index.css';
import './index.scss';

//hacky way to supress console functions instead of ejecting from CRA
//would be better to use custom CRA template or rewire CRA
if (process.env.NODE_ENV !== 'development') {
  console.log = () => {}
  console.dir = () => {}
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);


root.render(
  <React.StrictMode>
		<App />
  </React.StrictMode>
);


//React.StrictMode causes double-rendering of components in certain cases, so removed below

/*
root.render(
	<App />
);
*/

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
