import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
	faHouse,
	faGear,
	faAngleRight
} from '@fortawesome/free-solid-svg-icons'

import { db } from './db';
import { GlobalState } from './App';
import { LoadingIndicator } from './Common';
//import SetupModal from './components/SetupModal';

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
	//let [setupModalIsVisible, setSetupModalIsVisible] = useState(false);
	let [dbUpgradeIndicatorIsVisible, setDbUpgradeIndicatorIsVisible] = useState(false);
	//const initializedRef = useRef(false);
	
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

	useEffect( () => {
		db.on("versionchange", function(event) {
			console.warn('db versionchange detected');
			setDbUpgradeIndicatorIsVisible(true);
			document.body.classList.add('bodyLocked');
			/*
			if (confirm ("Another page tries to upgrade the database to version " +
										event.newVersion + ". Accept?")) {
				// Refresh current webapp so that it starts working with newer DB schema.
				window.location.reload();
			} else {
				// Will let user finish its work in this window and
				// block the other window from upgrading.
				return false;
			}
			*/
		});

		db.on("ready", function () {
			// Will trigger each time db is successfully opened.
			console.warn('the DB is now open and ready');
			setDbUpgradeIndicatorIsVisible(false);
			document.body.classList.remove('bodyLocked');
		}, true);
	}, []);
	
	return (
			<>
				<div className={styles.bodyLocked}></div>
		{/*<div className="columns">
			<div className="column">*/}
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
								return <React.Fragment key={link.path}>
									<NavLink 
										to={link.path} 
										className={`is-size-7-mobile level-item is-flex-grow-1 has-text-centered is-justify-content-center mx-0 ${styles.mainNavLink}`}
										style={{marginLeft: 0, marginRight:0}}
									>
										{link.name}
									</NavLink>
									{ 
										index < navLinks.length-1 &&
										<div 
											className="level-item has-text-centered is-flex-grow-0 is-flex-shrink-1"
											style={{marginLeft: '0.1rem', marginRight: '0.1rem'}}
										>
											<FontAwesomeIcon icon={faAngleRight} />
										</div>
									}
								</React.Fragment>
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
				<div 
					style={{
						height: '90vh', 
						width: '90vw', 
						backgroundColor: 'rgba(0,0,0,0.81)', 
						borderRadius: '2rem',
						position: 'absolute', 
						top: '5vh', 
						left: '5vw',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						boxSizing: 'border-box'
					}}
					className={ dbUpgradeIndicatorIsVisible ? '' : 'is-hidden'}
				>
					<div
						style={{margin: 'auto auto'}} 
					>
						<LoadingIndicator 
							loadingText=" "
						/>
						<p style={{color: '#FFF'}}>Database is upgrading. Please wait...</p>	
					</div>
				</div> 
				{/*
				<SetupModal 
					globalState={globalState} 
					setGlobalState={setGlobalState} 
					isModalVisible={setupModalIsVisible}
					setIsModalVisible={setSetupModalIsVisible}
				/>
				*/}
	{/*		</div>
		</div>*/}
		</>
	);
}

export default Builder;
