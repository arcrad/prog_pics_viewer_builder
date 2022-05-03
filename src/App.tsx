import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';

import { db, Entry, Setting } from './db';
import './App.css';
import EntryComponent from './Entry';
import Adjust from './Adjust';
import Viewer from './Viewer';
import Export from './Export';
import SettingsComponent from './Settings';
import ImageStorePOC from './ImageStorePOC';
import Builder from './Builder';

export type Settings = {
	[key: string]: number;
}
/*	markLineWidthScalePercent: number;
	markRadiusScalePercent: number;
	topLeftCornerCropCoordinateX: number;
	topLeftCornerCropCoordinateY: number;
	topRightCornerCropCoordinateX: number; 
	topRightCornerCropCoordinateY: number;
	bottomRightCornerCropCoordinateX: number;
	bottomRightCornerCropCoordinateY: number;
	bottomLeftCornerCropCoordinateX: number;
	bottomLeftCornerCropCoordinateY: number;
};*/

declare global {
	interface Window {
		showDirectoryPicker: any;
		showOpenFilePicker: any;
		VideoFrame: any;
	}
};

export type GlobalState = {
	currentEntryId: number;
	settings: Settings;
};

const defaultSettings:Settings = {
	markLineWidthScalePercent: 0.007,
	markRadiusScalePercent: 0.015,
	topLeftCornerCropCoordinateX: -1,
	topLeftCornerCropCoordinateY: -1,
	topRightCornerCropCoordinateX: -1,
	topRightCornerCropCoordinateY: -1,
	bottomRightCornerCropCoordinateX: -1,
	bottomRightCornerCropCoordinateY: -1,
	bottomLeftCornerCropCoordinateX: -1,
	bottomLeftCornerCropCoordinateY: -1
};

function App() {
	let [globalState, setGlobalState] = useState<GlobalState>({ 
		currentEntryId: -1,
		settings: defaultSettings
	});

	/*const entries = useLiveQuery(
		() => db.entries.toArray()
	);*/
	
	
	const updateGlobalStateSettings = () => {	
		console.log('update settings in globalState');
		//console.dir(currentSettings);
		setGlobalState( (cs):GlobalState => {
			if(currentSettings) {
				const settingsObject:Settings = currentSettings.reduce( (accumulator, currentSetting) => { 
					return { ...accumulator, ...{ [currentSetting.key as string]: currentSetting.value as number} }
				}, {} as Settings );
				//console.dir(settingsObject);
				const ns = { settings: settingsObject };
				return { ...cs, ...ns };
			}
			return cs;
		});
	}
	
	let currentSettings = useLiveQuery( () => {
		return db.settings.toArray();
	});
	
	useEffect( () => {
		console.log('initialize app settings');
		db.settings.toArray().then( (settings) => {
			let existingSettingsInDb = settings.reduce( (accumulator, currentSetting) => {
				if(currentSetting.key) {
					return [...accumulator, currentSetting.key];
				}
				return accumulator;
			}, [] as string[]);
			let settingsToSetDefaultFor = Object.keys(defaultSettings).filter( (setting) => {
				return !existingSettingsInDb.includes(setting);
			});
			//console.log(`existingSettingsInDb = ${existingSettingsInDb}`);
			//console.log(`settingsToSetDefaultFor = ${settingsToSetDefaultFor}`);
			const settingsToUpdate = settingsToSetDefaultFor.reduce( (accumulator, settingKey) => {
				return [...accumulator, {key: settingKey, value: defaultSettings[settingKey]} ];
			}, [] as Setting[]);
			//console.log(`settingsToUpdate = ${JSON.stringify(settingsToUpdate)}`);
			db.settings.bulkPut(settingsToUpdate).then( () => {
				console.log(`updated settings in db from defaults`);
			});
		});
	}, []);

	useEffect( () => {
		console.log('app: update settings from db');
		updateGlobalStateSettings();
	}, [currentSettings]);

	useEffect( () => {
		console.log('app initialize currentEntryId');
		async function initializeCurrentEntryId() {
			const entries = await db.entries.orderBy('date').reverse().toArray();
			setGlobalState( (cs):GlobalState => {
				console.log(JSON.stringify(cs));
				if(entries) {
					let ns = { currentEntryId: entries[0]?.id || 0 };
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
    		<Route 
					path="/" 
					element={
						<Builder 
							globalState={globalState} 
							setGlobalState={setGlobalState}
						/>
					}
				>
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
						path="adjust" 
						element={
							<Adjust
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
					<Route 
						path="export" 
						element={
							<Export 
								globalState={globalState} 
								setGlobalState={setGlobalState}
							/>
						} 
					/>
					<Route 
						path="settings" 
						element={
							<SettingsComponent
								globalState={globalState} 
								setGlobalState={setGlobalState}
							/>
						} 
					/>
				</Route>
			</Routes>
		</BrowserRouter>
    </div>
  );
}

export default App;
