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
			/*clearTimeout(debounceInputTimeout.current);
			let modifyDbValueHandler = () => {
					console.log('fire update db with new input', newValue, settingKeyToUpdate);
					db.settings.update(settingKeyToUpdate, {
						value: newValue
					});
			};
			debounceInputTimeout.current = window.setTimeout( modifyDbValueHandler, 500);*/
		}
	};

  return (
    <div>
    	<h2>Settings</h2>
			<ul>
			{
				currentSettings?.map( (setting) => 
					<li key={setting.key}> 
						{setting.key} :&nbsp;
						<input 
							type="text" 
							value={setting.value} 
							data-setting-key-to-update={setting.key}
							onChange={handleSettingInputChange}
						/>
					</li>
				)
			}
			</ul>
		</div>
  );
}

export default SettingsComponent;
