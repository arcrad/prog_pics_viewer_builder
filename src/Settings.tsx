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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
	faUpload, 
	faTrashAlt,
} from '@fortawesome/free-solid-svg-icons'
import {importDB, exportDB, importInto, peakImportFile} from "dexie-export-import";
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

import { db, Setting } from './db';
import { GlobalState, Settings } from './App';
//import './Settings.css';

type SettingsAttributes = {
	globalState: GlobalState;
	setGlobalState: Dispatch<SetStateAction<GlobalState>>;	
};

function exportDbProgressCallbackFactory(
	setExportDbDataRowsExported, 
	setExportDbDataMaxRows, 
	setCurrentCompletedRows,
	setCurrentMaxRows,
	setProgressPadding
) {
	return (details:ExportProgress) => {
		console.log('exportDbProgressCallBack() called');
		console.log(JSON.stringify(details));
		const rowCountPadding = (Math.max(1, parseInt(details.totalRows*0.3)));
		setExportDbDataMaxRows(details.totalRows+rowCountPadding);
		setCurrentMaxRows(details.totalRows+rowCountPadding);
		setProgressPadding(rowCountPadding);
		setExportDbDataRowsExported(details.completedRows);
		setCurrentCompletedRows(details.completedRows);
	}
}

async function handleExportDbButtonClick(setExportDbDataRowsExported, setExportDbDataMaxRows) {
	console.log('handleExportDbButtonClick() called');
	//const dbBlob = await db.export({
	let currentCompletedRows = 0;
	let currentMaxRows = 0;
	let progressPadding = 0;
	let setCurrentCompletedRows = (newVal) => { currentCompletedRows = newVal };
	let setCurrentMaxRows = (newVal) => { currentMaxRows = newVal };
	let setProgressPadding = (newVal) => { progressPadding = newVal };
	const exportDbProgressCallback = exportDbProgressCallbackFactory(
		setExportDbDataRowsExported,
		setExportDbDataMaxRows,
		setCurrentCompletedRows,
		setCurrentMaxRows,
		setProgressPadding
	);
	console.log('before generate dbBlob');
	const dbBlob = await exportDB(db, {
		prettyJson: true, 
		numRowsPerChunk: 1,
		progressCallback: exportDbProgressCallback,
	}); //[options]
	console.log('after generate dbBlob');
	const zip = new JSZip();
	zip.file("db_data.json", dbBlob);
	console.log('after add dbBlob to zip');
	//saveAs(dbBlob, "db_export.json");
	await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: {
        level: 9
    },
		streamFiles: true
	}, (metadata) => {
		if(metadata.percent) {
		setExportDbDataRowsExported(currentCompletedRows+(progressPadding*(metadata.percent/100)));
		}
	})
		.then(function (blob) {
			console.log('final zip generated!');
	    saveAs(
				blob, 
				`${(new Date).toISOString().substring(0,10).replaceAll('-','')}-db_export.zip`
			);
			setExportDbDataRowsExported(currentMaxRows);
		});
}


function importDataCallbackFunctionFactory(
	setImportDbDataMaxRows,
	setImportDbDataRowsImported
) {
	return (progressData: importProgress) => {
		console.log('importDataCallbackFunction() called');
		console.log(JSON.stringify(progressData));
		setImportDbDataMaxRows(progressData.totalRows);
		setImportDbDataRowsImported(progressData.completedRows);
	}
}

const handleDbDataFileLoad = async (
	dbDataFileUploadRef,
	setImportDbDataMaxRows,
	setImportDbDataRowsImported,
	setImportDbDataStatus
) => {
	//console.dir(dbDataFileUploadRef.current);
	console.log("handle load db data..");
	setImportDbDataStatus('Started');
	let selectedFile:File;
	if(dbDataFileUploadRef.current && dbDataFileUploadRef.current.files) {
		selectedFile = dbDataFileUploadRef.current.files[0];
		const zip = new JSZip();
		await zip.loadAsync(selectedFile)
    console.log(zip.files);
		const dbDataBlob = await zip.file("db_data.json").async("blob");
		console.dir(dbDataBlob);
		await importInto(db, dbDataBlob, {
			overwriteValues: true,
			clearTablesBeforeImport: true, 
			progressCallback: importDataCallbackFunctionFactory(
				setImportDbDataMaxRows,
				setImportDbDataRowsImported
			)
		});
		setImportDbDataStatus('Complete');
	}
};




function SettingsComponent({
	globalState,
	setGlobalState
}: SettingsAttributes) {
	let [exportDbDataMaxRows, setExportDbDataMaxRows] = useState(0);
	let [exportDbDataRowsExported, setExportDbDataRowsExported] = useState(0);
	let [exportDbDataInProgress, setExportDbDataInProgress] = useState(false);
	let [importDbDataMaxRows, setImportDbDataMaxRows] = useState(0);
	let [importDbDataRowsImported, setImportDbDataRowsImported] = useState(0);
	let [importDbDataStatus, setImportDbDataStatus] = useState('Not Started');

	const dbDataFileUploadContainerRef = useRef<HTMLDivElement>(null);
	const dbDataFileUploadRef = useRef<HTMLInputElement>(null);
	const dbDataFileUploadFileNameRef = useRef<HTMLSpanElement>(null);
	
	useEffect( () => {
		if(dbDataFileUploadRef && dbDataFileUploadRef.current) {
			dbDataFileUploadRef.current.onchange = () => {
				if(dbDataFileUploadRef.current 
					&& dbDataFileUploadRef.current.files
					&& dbDataFileUploadRef.current.files.length > 0) {
						if(dbDataFileUploadFileNameRef.current) {
		      		dbDataFileUploadFileNameRef.current.textContent = dbDataFileUploadRef.current.files[0].name;
							handleDbDataFileLoad(
								dbDataFileUploadRef,
								setImportDbDataMaxRows,
								setImportDbDataRowsImported,
								setImportDbDataStatus
							);
						}
    		}
			};
		}
	},[]);

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

	let handleDeleteAllEntries = () => {
		const doDelete = window.confirm('Are you sure you want to delete all entries? There is no way to get them back unless you have Exported a backup.');
		if(doDelete) {
			db.entries.clear();
		}
	};

  return (
    <>
			<div className="columns is-mobile is-centered">
				<div className="column is-12">
					<div className="hero is-small is-primary">
						<div className="hero-body">
    					<h2 className="title">Settings</h2>
							<p className="subtitle">Export/Import data, and view/modify application settings.</p>
						</div>
					</div>
				</div>
			</div>
			<div className="columns is-mobile is-centered">
				<div className="column is-11-mobile is-10-tablet is-8-desktop">
					<div className="box">
						<h2 className="title is-5">Export/Import Raw Data</h2>
						<p className="mb-5">Since your data is only stored locally on your device, it could be deleted if your browser's IndexedDB storage gets cleared. If you want to ensure your data is safe, use the following options to export the raw data and, if needed, to import previously exported raw data.</p>
						<div className="columns">
							<div className="column is-narrow">					
								<div className="field">
									<label className="label">Export</label>
									<button 
										type="button"
										className={`button ${ exportDbDataInProgress ? 'is-loading' : '' }`}
										onClick={async () => {
											setExportDbDataInProgress(true);
											await handleExportDbButtonClick(setExportDbDataRowsExported, setExportDbDataMaxRows)
											setExportDbDataInProgress(false);
										}}
									>
										Export Data
									</button>
								</div>
							</div>
							<div className="column">
								<div className="field">
									<label className="label">Data Export Progress</label>
									<div className="control">
										<progress 
											className="progress is-info"
											max={exportDbDataMaxRows ? exportDbDataMaxRows : 0}
											value={exportDbDataRowsExported}
										>
											{exportDbDataRowsExported} rows exported out of {exportDbDataMaxRows ? exportDbDataMaxRows : 0}
										</progress>
									</div>
								</div>
							</div>
						</div>
						<hr/>
						<div className="columns">
							<div className="column is-narrow">
								<div className="field">
									<label className="label">Import</label>
									<div 
										ref={dbDataFileUploadContainerRef}
										className="file is-boxed has-name"
									>
										<label className="file-label">
											<input 
												ref={dbDataFileUploadRef} 
												type="file"
												className="file-input"
											/>
											<span className="file-cta">
												<FontAwesomeIcon icon={faUpload}/>
												<span className="file-label">
													Select data file...
												</span>
											</span>
											<span ref={dbDataFileUploadFileNameRef} className="file-name"></span>
										</label>
									</div>
								</div>
							</div>
							<div className="column">
								<div className="field">
									<label className="label">Data Import Progress</label>
									<div className="control">
										<progress 
											className="progress is-info"
											max={importDbDataMaxRows ? importDbDataMaxRows : 0}
											value={importDbDataRowsImported}
										>
											{importDbDataRowsImported} rows exported out of {importDbDataMaxRows ? importDbDataMaxRows : 0}
										</progress>
									</div>
								</div>
								<p>Import Status: {importDbDataStatus}</p>
							</div>
						</div>
					</div>
					<div className="box">
						<h2 className="title is-5">Delete All Entries</h2>
						<p className="mb-5">Delete all entries stored in this app.</p>
						<button 
							type="button" 
							className="button is-danger"
							title="Delete All Entries"
							onClick={handleDeleteAllEntries}
						>
							<span className="pe-none">
								Delete All Entries&nbsp;
							</span>
							<FontAwesomeIcon 
								className="pe-none"
								icon={faTrashAlt}
							/>
						</button>
					</div>
					<div className="box">
						<h2 className="title is-5">View/Modify Settings</h2>
						<p className="mb-5">These settings are managed by the application and should not normally need to be edited. They are primarly provided here for diagnostic/debugging purposes. </p>
						<div>
						{
							currentSettings?.map( (setting, id) => 
								<div className="field" key={id}> 
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
