import 
	React, 
	{ 
		useState, 
		useEffect, 
		useRef, 
		Dispatch, 
		SetStateAction, 
		MouseEvent,
		ChangeEvent 
	} from 'react';
import {
	useNavigate,
	useParams,
} from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';

import { db, Entry } from './db';
import { GlobalState } from './App';
//import './EntriesValidator.css';

export type ValidationResults = {
	[key: string]: boolean;
	moreThanZeroEntries: boolean;
	allEntriesHaveImageBlob: boolean;
	allEntriesHaveThumbImageBlob: boolean;
	allEntriesHaveAlignedImageBlob: boolean;
	allEntriesHaveDate: boolean;
	allEntriesHaveWeight: boolean;
	allEntriesHaveAllMarks: boolean;
	adjustmentImageCropAndScalingChosen: boolean;
};

export const defaultValidationResults:ValidationResults = {
	moreThanZeroEntries: false,
	allEntriesHaveImageBlob: false,
	allEntriesHaveThumbImageBlob: false,
	allEntriesHaveAlignedImageBlob: false,
	allEntriesHaveDate: false,
	allEntriesHaveWeight: false,
	allEntriesHaveAllMarks: false,
	adjustmentImageCropAndScalingChosen: false,
};

const validationResultsDisplayNameMap:{[key: string]: string} = {
	moreThanZeroEntries: 'There is at least one entry?',
	allEntriesHaveImageBlob: 'All Entries have an Image?',
	allEntriesHaveThumbImageBlob: 'All Entries have a Thumbnail?',
	allEntriesHaveAlignedImageBlob: 'All Entries have an aligned image?',
	allEntriesHaveDate: 'All Entries have a date?',
	allEntriesHaveWeight: 'All Entries have a weight?',
	allEntriesHaveAllMarks: 'All Entries have three marks?',
	adjustmentImageCropAndScalingChosen: 'A crop/scaling image was chosen?',
};

type EntriesValidatorAttributes= {
	validationResults: ValidationResults;
	setValidationResults: Dispatch<SetStateAction<ValidationResults>>;
	showOnlyErrors?: boolean;
	displayOnlyTheseValidations?: string[];
};


function EntriesValidator({
	validationResults,
	setValidationResults,
	showOnlyErrors,
	displayOnlyTheseValidations
} : EntriesValidatorAttributes ) {
	let [statusMessages, setStatusMessages] = useState<string[]>([]);
	
	let modalOverlayRef = useRef<HTMLDivElement>(null);

	const entries = useLiveQuery(
		() => db.entries.toArray()
	);
	
	useEffect( () => {
		async function doValidations() {
			console.log('do validation, entries updated');
			let newValidationResults:ValidationResults = {
				moreThanZeroEntries: true,
				allEntriesHaveImageBlob: true,
				allEntriesHaveThumbImageBlob: true,
				allEntriesHaveAlignedImageBlob: true,
				allEntriesHaveDate: true,
				allEntriesHaveWeight: true,
				allEntriesHaveAllMarks: true,
				adjustmentImageCropAndScalingChosen: true,
			};
	
	
			if(entries) {
				//check entry count 
				if(entries.length == 0) {
					newValidationResults.moreThanZeroEntries = false;
				}
				//check for base images
				for(const entry of entries) {
					if(entry.imageBlob == null) {
						newValidationResults.allEntriesHaveImageBlob = false;
						break;
					}
				}
				//check for thumb images
				for(const entry of entries) {
					if(entry.thumbImageBlob == null) {
						newValidationResults.allEntriesHaveThumbImageBlob = false;
						break;
					}
				}
				//check for aligned images
				for(const entry of entries) {
					if(entry.alignedImageBlob == null) {
						newValidationResults.allEntriesHaveAlignedImageBlob = false;
						break;
					}
				}
				//check for date 
				for(const entry of entries) {
					if(entry.date == null) {
						newValidationResults.allEntriesHaveDate = false;
						break;
					}
				}
				//check for weight
				for(const entry of entries) {
					if(entry.weight == null) {
						newValidationResults.allEntriesHaveWeight = false;
						break;
					}
				}
				//check for marks
				for(const entry of entries) {
					if(entry.marks == null || Object.keys(entry.marks).length != 3) {
						newValidationResults.allEntriesHaveAllMarks = false;
						break;
					}
				}
				//check for crop/scaling image chosen 
				await db.settings.get('chosenEntryIdForAdjustments').then((_chosenEntryIdForAdjustments) => {
					if(_chosenEntryIdForAdjustments == null) {
					console.warn(`validation: _chosenEntryIdForAdjustments = ${_chosenEntryIdForAdjustments}`);
						newValidationResults.adjustmentImageCropAndScalingChosen = false;
					}
				});
				setValidationResults(newValidationResults);
				console.dir(newValidationResults);
				console.warn('setvalidationresults');
			}
		}
		doValidations();
	}, [entries]);

	//if needed, get subset of validations
	let filteredValidationResultsKeys = displayOnlyTheseValidations != null ? 
		Object.keys(validationResults).filter( (key) => {
			return displayOnlyTheseValidations.includes(key);
		})
		:
		Object.keys(validationResults);
		
	//if needed, filter out any non-errors
	filteredValidationResultsKeys = showOnlyErrors ? 
		filteredValidationResultsKeys.filter( (key) => {
			return !validationResults[key];
		})
		:
		filteredValidationResultsKeys;

	return (
		<>
		{
			entries && filteredValidationResultsKeys.length > 0 ?
			<article className="message is-warning">
  			<div className="message-header">
					<p>Validation Results</p>
				</div>
				<div className="message-body">
					{ entries == null && <p>Validating entries...</p>}
					{ entries && 
						<ul>
						{
							filteredValidationResultsKeys.map( (key, index) => {
								return <li key={index}>
									{validationResultsDisplayNameMap[key]} {validationResults[key] ? '✅' : '❌'}
								</li>
							})
						}
						</ul>
					}
				</div>
			</article>
			:
			<></>
		}
		</>
  );
}

export default EntriesValidator;
