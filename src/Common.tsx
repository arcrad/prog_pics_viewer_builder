import React, { useEffect, useRef, Dispatch, SetStateAction, MouseEvent} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
	faAngleDown, 
} from '@fortawesome/free-solid-svg-icons'

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


type PaginationControlsAttributes = {
	curPage: number;
	maxPage: number; 
	pagerOffset: number;
	pagerLimit: number;
	totalEntriesCount: number;
	setPagerOffset: Dispatch<SetStateAction<number>>;
}

export function PaginationControls({
	curPage, 
	maxPage, 
	pagerOffset, 
	pagerLimit, 
	totalEntriesCount,
	setPagerOffset
}:PaginationControlsAttributes) {
	let midPageControls;
	if(maxPage < 2) {
		//no mid page controls
	} else if (maxPage < 5) {
		midPageControls = Array.from({length: maxPage-1}, (x, i) => i+1).map( (listOffset) => {
			return <li 
					key={listOffset+1}
					className={`pagination-link ${pagerOffset/pagerLimit == (listOffset) ? 'is-current' : ''}`}
					onClick={() => {
						setPagerOffset((listOffset)*pagerLimit)
					}}
				>
					{listOffset+1}
				</li>
			})
	} else if(curPage < 3) {
		midPageControls = <>
			{
				[1,2,3].map( (listOffset) => {
				return <li 
						key={listOffset+1}
						className={`pagination-link ${pagerOffset/pagerLimit == (listOffset) ? 'is-current' : ''}`}
						onClick={() => {
							setPagerOffset((listOffset)*pagerLimit)
						}}
					>
						{listOffset+1}
					</li>
				})
			}
			<li className="pagination-ellipses">&hellip;</li>
		</>
	} else if (curPage > maxPage-3) {
		midPageControls = <>
			<li className="pagination-ellipses">&hellip;</li>
			{
				[maxPage-3,maxPage-2,maxPage-1].map( (listOffset) => {
					return <li 
						key={listOffset+1}
						className={`pagination-link ${pagerOffset/pagerLimit == listOffset ? 'is-current' : ''}`}
						onClick={() => {
							setPagerOffset((listOffset)*pagerLimit)
						}}
					>
						{listOffset+1}
					</li>
				})
			}
		</>
	} else {
		midPageControls = <>
			<li className="pagination-ellipses">&hellip;</li>
			{
				[-1,0,1].map( (listOffset) => {
					return <li 
						key={listOffset+1}
						className={`pagination-link ${pagerOffset/pagerLimit == (curPage+listOffset) ? 'is-current' : ''}`}
						onClick={() => {
							setPagerOffset((curPage+listOffset)*pagerLimit)
						}}
					>
						{curPage+listOffset+1}
					</li>
				})
			}
			<li className="pagination-ellipses">&hellip;</li>
		</>
	}

	return (
		
				<nav className="pagination" role="navigation" aria-label="pagination">
					<a 
						className="pagination-previous"
						onClick={() => {
							setPagerOffset( curOffset => {
								return curOffset - pagerLimit >= 0 ? curOffset - pagerLimit : 0
							})
						}}
					>
						Previous
					</a>
					<a 
						className="pagination-next"
						onClick={() => {
							setPagerOffset( curOffset => {
								if(totalEntriesCount && curOffset < totalEntriesCount - pagerLimit) {
									return curOffset + pagerLimit < totalEntriesCount ? curOffset + pagerLimit : totalEntriesCount - pagerLimit
								}
								return curOffset;
							})
						}}
					>
						Next
					</a>
					<ul className="pagination-list">
						<li 
							className={`pagination-link ${pagerOffset == 0 ? 'is-current' : ''}`}
							onClick={() => {
								setPagerOffset(0)
							}}
						>
							1
						</li>
						{ midPageControls }
						{
							totalEntriesCount != null
							&& Math.floor((totalEntriesCount-1)/pagerLimit) > 0
							&&
						<li 
							className={`pagination-link ${totalEntriesCount && pagerOffset/pagerLimit == Math.ceil((totalEntriesCount)/pagerLimit)-1 ? 'is-current' : ''}`}
					onClick={() => {
						if(totalEntriesCount) {
							setPagerOffset(Math.floor((totalEntriesCount-1)/pagerLimit)*pagerLimit)
						}
					}}
						>
							{totalEntriesCount ? Math.ceil(totalEntriesCount/pagerLimit) : 'N/A'}
						</li>
						}
					</ul>
				</nav>
	)
}

type EntryOptionsDropdownAttributes = {
	entryId: string | number;
}

export function EntryOptionsDropdown({
	entryId,
	children
}: React.PropsWithChildren<EntryOptionsDropdownAttributes>) {
	const dropdownRef = useRef<HTMLDivElement>(null);
	const triggerButtonRef = useRef<HTMLButtonElement>(null);

	useEffect( () => {
		//setup body listener for potential dropdown clicks
		//this approach is wasteful as it creates a redundant listner for each dropdown
		//while this encapsulates the functionality within the component, it could
		//be better to create one global listener
		function handleClickEvent(event: Event) {
			if(!dropdownRef.current || !triggerButtonRef.current) {
				return;
			}
			//recursively try to find the trigger button
			let triggerButtonClicked = false;
			let dropdownClicked = false;
			let curElement = event.target;
			let depth = 0;
			while (curElement) {
				if(curElement == triggerButtonRef.current) {
					console.warn('triggerButton found');
					triggerButtonClicked = true;
					break;
				}
				if(curElement == dropdownRef.current && depth < 4) {
					console.warn('dropdown found');
					dropdownClicked = true;
					break;
				}
		    curElement = (curElement as HTMLElement).parentElement;
				depth++;
			}
			//if trigger button clicked then show menu, otherwise hide menu
			if(triggerButtonClicked) {
				dropdownRef.current.classList.toggle('is-active');
			} else if(dropdownClicked) {
				dropdownRef.current.classList.add('is-active');
			} else {
				dropdownRef.current.classList.remove('is-active');
			}
		}
		document.body.addEventListener('click', handleClickEvent);
		return () => {
			document.body.removeEventListener('click', handleClickEvent);
		}
	}, []);
	
	return (
		<div 
			ref={dropdownRef}
			id={`entry-dropdown-${entryId}`} 
			className="dropdown is-right"
		>
			<div className="dropwdown-trigger">
				<button 
					ref={triggerButtonRef}
					className="button" 
					aria-haspopup="true" 
					aria-controls={`dropdown-entry-menu-${entryId}`} 
				>
					<span>Options</span>
					<span className="icon is-small">
						<FontAwesomeIcon icon={faAngleDown}/>
					</span>
				</button>
			</div>
			<div className="dropdown-menu" id={`dropdown-entry-menu-${entryId}`} role="menu">
				<div className="dropdown-content">
					{children}
				</div>
			</div>
		</div>
	);
}
	
