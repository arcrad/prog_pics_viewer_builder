import 
	React, 
	{
		useState, 
		useRef, 
		useEffect,
		Dispatch,
		SetStateAction,
		ChangeEvent
	}
from 'react';
import { useLiveQuery } from 'dexie-react-hooks';

import { db, Setting } from './db';
import { GlobalState, Settings } from './App';
//import './Settings.css';

type SettingsAttributes = {
	globalState: GlobalState;
	setGlobalState: Dispatch<SetStateAction<GlobalState>>;	
};

function SettingsComponent({
	globalState,
	setGlobalState
}: SettingsAttributes) {

	const updateGlobalStateSettings = () => {	
		console.log('update settings in globalState');
		console.dir(currentSettings);
		setGlobalState( (cs):GlobalState => {
			if(currentSettings) {
				const settingsObject:Settings = currentSettings.reduce( (accumulator, currentSetting) => { 
					return { ...accumulator, ...{ [currentSetting.key as string]: currentSetting.value as number} }
				}, {} as Settings );
				console.dir(settingsObject);
				const ns = { settings: settingsObject };
				return { ...cs, ...ns };
			}
			return cs;
		});
	}
	
	let currentSettings = useLiveQuery( () => {
		return db.settings.toArray()
	});

	let addSetting = async () => {
		try {
			const id = await db.settings.put(
				{ key: 'markRadiusScalePercent', value: 0.01 }, 
			);
			const id2 = await db.settings.put(
				{ key: 'markLineWidthScalePercent', value: 0.005 }, 
			);
			console.log( 'new id =', id);
		} catch(error) {
			console.error(`failed to add db entry. ${error}`);
		}
	};
	useEffect( () => {
		//addSetting();
	}, []);
	
	useEffect( () => {
		console.log('based on current settings change, update settings');
		updateGlobalStateSettings();
	}, [currentSettings]);
	
	let debounceInputTimeout = useRef(0);
	const handleSettingInputChange = async (event:ChangeEvent<HTMLInputElement>) => {
		console.log('handleSettingInputChange');
		if(
			event.target
			&& event.target instanceof HTMLInputElement
			&& event.target.dataset.settingKeyToUpdate
		) {
			let settingKeyToUpdate = event.target.dataset.settingKeyToUpdate;
			let newValue = event.target.value;
			console.log('settingKeyToUpdate = ', settingKeyToUpdate);
			console.log('value = ', newValue);
			//do db update
			db.settings.update(settingKeyToUpdate, {
				value: newValue
			});
		}
	};

  return (
    <>
			<div className="columns is-mobile is-centered">
				<div className="column is-12">
					<div className="hero is-small is-primary">
						<div className="hero-body">
    					<h2 className="title">Settings</h2>
							<p className="subtitle">View and modify settings.</p>
						</div>
					</div>
				</div>
			</div>
			<div className="columns is-mobile is-centered">
				<div className="column is-11-mobile is-10-tablet is-8-desktop">
					<div className="box">
						<p className="mb-5">These settings are managed by the application and should not normally need to be edited. They are primarly provided here for diagnostic/debugging purposes. </p>
			<div>
			{
				currentSettings?.map( (setting) => 
					<div className="field"> 
						<label className="label">{setting.key}</label>
						<div className="control"> 
							<input 
								type="text" 
								className="input"
								value={setting.value} 
								data-setting-key-to-update={setting.key}
								onChange={handleSettingInputChange}
							/>
						</div>
					</div>
				)
			}
			</div>
			</div>
			</div>
			</div>
		</>
  );
}

export default SettingsComponent;
