import { Entry } from './db';

type EntryValidationErrorsListAttributes = {
	entry: Entry;
}

export function EntryValidationErrorsList({
	entry
}: EntryValidationErrorsListAttributes) {
	const entryHasAllMarks = entry.marks && Object.keys(entry.marks).length == 3; 
	const entryDoesntHaveWeight = entry.weight == null || String(entry.weight) == '';
	const entryDoesntHaveDate = entry.date == null;
	const entryDoesntHaveImageBlob = entry.imageBlob == null;
	const entryDoesntHaveAlignedImageBlob = entry.alignedImageBlob == null;
	let validationErrorsListContent;
	if( 
		!entryHasAllMarks 
		|| entryDoesntHaveWeight 
		|| entryDoesntHaveDate
		|| entryDoesntHaveImageBlob
		|| entryDoesntHaveAlignedImageBlob
	) {
		validationErrorsListContent = <div>
			⚠️  This entry has validation errors!
			<ul>
				{ entryDoesntHaveImageBlob ? <li>❌ Entry is is missing image</li> : ''}
				{ entryDoesntHaveWeight ? <li>❌ Entry is missing weight</li> : ''}
				{ entryHasAllMarks ? '' : <li>❌ Entry doesn't have all marks</li>}
				{ entryDoesntHaveDate ? <li>❌ Entry is missing date</li> : ''}
				{ entryDoesntHaveAlignedImageBlob ? <li>❌ Entry is missing an aligned image</li> : ''}
			</ul>
		</div>
	}
	return <>
		{ validationErrorsListContent } 
	</>;
}
