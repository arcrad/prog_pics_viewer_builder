import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Outlet, Link } from 'react-router-dom';

import { db, Entry } from './db';


function Builder() {
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
		</div>
	);
}

export default Builder;
