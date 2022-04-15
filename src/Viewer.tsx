import React, { Dispatch, SetStateAction }from 'react';
//import './Viewer.css';
import { GlobalState } from './App';

type ViewerAttributes = {
	globalState: GlobalState;
	setGlobalState: Dispatch<SetStateAction<GlobalState>>;
}

function Viewer({
	globalState,
	setGlobalState
}:ViewerAttributes) {
  return (
    <div>
    	<h2>Viewer ( id = {globalState.currentEntryId} )</h2>
		</div>
  );
}

export default Viewer;
