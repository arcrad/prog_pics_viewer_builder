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
	allEntriesHaveImageBlob: boolean;
	allEntriesHaveThumbImageBlob: boolean;
	allEntriesHaveAlignedImageBlob: boolean;
	allEntriesHaveDate: boolean;
	allEntriesHaveWeight: boolean;
	allEntriesHaveAllMarks: boolean;
};

export const defaultValidationResults:ValidationResults = {
	allEntriesHaveImageBlob: false,
	allEntriesHaveThumbImageBlob: false,
	allEntriesHaveAlignedImageBlob: false,
	allEntriesHaveDate: false,
	allEntriesHaveWeight: false,
	allEntriesHaveAllMarks: false,
};

const validationResultsDisplayNameMap:{[key: string]: string} = {
	allEntriesHaveImageBlob: 'All Entries have an Image?',
	allEntriesHaveThumbImageBlob: 'All Entries have a Thumbnail?',
	allEntriesHaveAlignedImageBlob: 'All Entries have an aligned image?',
	allEntriesHaveDate: 'All Entries have a date?',
	allEntriesHaveWeight: 'All Entries have a weight?',
	allEntriesHaveAllMarks: 'All Entries have three marks?',
};

type EntriesValidatorAttributes= {
	validationResults: ValidationResults;
	setValidationResults: Dispatch<SetStateAction<ValidationResults>>;
};


function EntriesValidator({
	validationResults,
	setValidationResults
} : EntriesValidatorAttributes ) {
	let [statusMessages, setStatusMessages] = useState<string[]>([]);
	
	let modalOverlayRef = useRef<HTMLDivElement>(null);

	const entries = useLiveQuery(
		() => db.entries.toArray()
	);
	
	useEffect( () => {
		console.log('do validation, entries updated');
		let newValidationResults:ValidationResults = {
			allEntriesHaveImageBlob: true,
			allEntriesHaveThumbImageBlob: true,
			allEntriesHaveAlignedImageBlob: true,
			allEntriesHaveDate: true,
			allEntriesHaveWeight: true,
			allEntriesHaveAllMarks: true,
		};

		if(entries) {
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
			
			setValidationResults(newValidationResults);
		}
	}, [entries]);

	return (
			<div style={{
				border: '1px solid black', 
				padding: '1rem', 
				margin: '1rem'
			}}>
				<p>Validation Results</p>
				{ entries == null && <p>Validating entries...</p>}
				{ entries && 
				<ul>
				{
					Object.keys(validationResults).map( (key, index) => {
						return <li key={index}>
							{validationResultsDisplayNameMap[key]} {validationResults[key] ? '✅' : '❌'}
						</li>
					})
				}
				</ul>
				}
			</div>
  );
}

export default EntriesValidator;
