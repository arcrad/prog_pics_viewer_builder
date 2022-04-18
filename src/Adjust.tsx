import React, { Dispatch, SetStateAction }from 'react';
//import './Adjust.css';
import { GlobalState } from './App';

type AdjustAttributes = {
	globalState: GlobalState;
	setGlobalState: Dispatch<SetStateAction<GlobalState>>;
}

function Adjust({
	globalState,
	setGlobalState
}:AdjustAttributes) {
  return (
    <div>
    	<h2>Adjust ( id = {globalState.currentEntryId} )</h2>
		</div>
  );
}

export default Adjust;
