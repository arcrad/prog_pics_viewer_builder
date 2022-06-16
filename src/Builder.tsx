import React, { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Outlet, NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
	faHouse,
	faGear,
	faAngleRight
} from '@fortawesome/free-solid-svg-icons'

import { db, Entry } from './db';
import { GlobalState } from './App';
import SetupModal from './SetupModal';

import styles from './Builder.module.scss';

const navLinks = [
	{ 
		name: 'Entries',
		path: '/entry'
	},
	{ 
		name: 'Adjust',
		path: '/adjust'
	},
	{ 
		name: 'Process',
		path: '/process'
	},
	{ 
		name: 'Export',
		path: '/export'
	},
/*	{ 
		name: 'Settings',
		path: '/settings'
	}*/
];

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
		<div className="columns">
			<div className="column">
				<nav role="navigation" aria-label="main navigation">
					<div className="level is-mobile">
						{/*<NavLink className="navbar-item" to="/">Builder (Home)</NavLink>*/}
						<NavLink 
							to="/" 
							title="Home"
							className={`level-item is-flex-grow-0 has-text-centered is-justify-content-center mx-0 ${styles.mainNavLink}`}
							style={{marginLeft: 0, marginRight:0, borderRight: '1px solid #ccc'}}
						>
							<FontAwesomeIcon icon={faHouse} />
						</NavLink>
						{
							navLinks.map( (link, index) => {
								return <>
									<NavLink 
										to={link.path} 
										className={`level-item is-flex-grow-1 has-text-centered is-justify-content-center mx-0 ${styles.mainNavLink}`}
										style={{marginLeft: 0, marginRight:0}}
									>
										{link.name}
									</NavLink>
									{ 
										index < navLinks.length-1 &&
										<div 
											className="level-item has-text-centered is-flex-grow-0 is-flex-shrink-1"
											style={{marginLeft: '0.25rem', marginRight: '0.25rem'}}
										>
											<FontAwesomeIcon icon={faAngleRight} />
										</div>
									}
								</>
							})
						}
						<NavLink 
							to="/settings" 
							title="Settings"
							className={`level-item is-flex-grow-0 has-text-centered is-justify-content-center mx-0 ${styles.mainNavLink}`}
							style={{marginLeft: 0, marginRight:0, borderLeft: '1px solid #ccc'}}
						>
							<FontAwesomeIcon icon={faGear} />
						</NavLink>
					</div>
				</nav>
				<div>
					<Outlet />
				</div>
				{/*
				<SetupModal 
					globalState={globalState} 
					setGlobalState={setGlobalState} 
					isModalVisible={setupModalIsVisible}
					setIsModalVisible={setSetupModalIsVisible}
				/>
				*/}
			</div>
		</div>
	);
}

export default Builder;
