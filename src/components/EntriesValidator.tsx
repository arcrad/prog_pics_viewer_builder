import 
	React, 
	{ 
		useEffect, 
		Dispatch, 
		SetStateAction, 
	} from 'react';
import { useLiveQuery } from 'dexie-react-hooks';

import { db } from '../db';
//import { GlobalState } from '../App';
//import './EntriesValidator.css';

export type ValidationResults = {
	[key: string]: boolean|undefined;
	moreThanZeroEntries?: boolean;
	allEntriesHaveImageBlob?: boolean;
	allEntriesHaveThumbImageBlob?: boolean;
	allEntriesHaveAlignedImageBlob?: boolean;
	allEntriesHaveDate?: boolean;
	allEntriesHaveWeight?: boolean;
	allEntriesHaveAllMarks?: boolean;
	adjustmentImageCropAndScalingChosen?: boolean;
	adjustmentImageCropAndScalingIsValid?: boolean;
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
	adjustmentImageCropAndScalingIsValid: false,
};

const validationResultsDisplayNameMap:{[key: string]: string} = {
	moreThanZeroEntries: 'There is at least one entry?',
	allEntriesHaveImageBlob: 'All Entries have an Image?',
	allEntriesHaveThumbImageBlob: 'All Entries have a Thumbnail?',
	allEntriesHaveAlignedImageBlob: 'All Entries have an aligned image?',
	allEntriesHaveDate: 'All Entries have a date?',
	allEntriesHaveWeight: 'All Entries have a weight?',
	allEntriesHaveAllMarks: 'All Entries have three marks?',
	adjustmentImageCropAndScalingChosen: 'A crop/scaling (adjust) image was chosen?',
	adjustmentImageCropAndScalingIsValid: 'The crop/scaling (adjust) image chosen is valid?',
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
	const entries = useLiveQuery(
		/*
		() => db
			.entries
			.filter((entry) => entry.draft !== true)
			.toArray()
		*/
		//TODO: investigate further why using equal() here throws UnknownError
		() => db.entries
			.where('isDraft')
			.notEqual(1)
			.toArray()
	);
	
	const settings = useLiveQuery(
		() => db.settings.toArray()
	);
	
	useEffect( () => {
		async function doValidations() {
			//console.log('do validation, entries updated');
			let newValidationResults:ValidationResults = {
				moreThanZeroEntries: true,
				allEntriesHaveImageBlob: true,
				allEntriesHaveThumbImageBlob: true,
				allEntriesHaveAlignedImageBlob: true,
				allEntriesHaveDate: true,
				allEntriesHaveWeight: true,
				allEntriesHaveAllMarks: true,
				adjustmentImageCropAndScalingChosen: true,
				adjustmentImageCropAndScalingIsValid: true,
			};
	
	
			if(entries) {
				//check entry count 
				if(entries.length === 0) {
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
					if(entry.marks == null || Object.keys(entry.marks).length !== 3) {
						newValidationResults.allEntriesHaveAllMarks = false;
						break;
					}
				}
				//check for crop/scaling image chosen 
				await db.settings.get('chosenEntryIdForAdjustments').then( async (_chosenEntryIdForAdjustments) => {
					if(_chosenEntryIdForAdjustments == null) {
					//console.warn(`validation: _chosenEntryIdForAdjustments = ${_chosenEntryIdForAdjustments}`);
						newValidationResults.adjustmentImageCropAndScalingChosen = false;
					}
					if(_chosenEntryIdForAdjustments && _chosenEntryIdForAdjustments.value) {
						await db.entries.get(parseInt(_chosenEntryIdForAdjustments.value)).then( (potentialChosenEntry) => {
								//console.log('potentialChosenEntry = ');
								//console.dir(potentialChosenEntry);
								if(potentialChosenEntry != null) {
									newValidationResults.adjustmentImageCropAndScalingIsValid = true;
								} else {
									newValidationResults.adjustmentImageCropAndScalingIsValid = false;
								}						
						});
					}
				});
				setValidationResults(newValidationResults);
				//console.dir(newValidationResults);
				//console.warn('setvalidationresults');
			}
		}
		doValidations();
	}, [entries, settings]);

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
								return <li key={key}>
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
