import 
	React,
	{
		useState,
		useRef,
		useEffect
	}
from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

import { db, Entry } from '../db';
import { GlobalState } from '../App';
import { LoadingIndicator } from '../Common';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);
const testData = {
						labels: ['Jan','Feb','March','Apr'],
						datasets: [
							{
      					label: 'Dataset 1',
								data: [69,42, 420, 4269],
								borderColor: 'rgb(255, 99, 132)',
								backgroundColor: 'rgba(255, 99, 132, 0.5)',
    					}
						]
};

type StatsComponentProps = {
	globalState: GlobalState;
	pagerOffset: number;
	pagerLimit: number;
};

function StatsComponent({
	globalState,
	pagerOffset,
	pagerLimit
}: StatsComponentProps) {
	let [showAllData, setShowAllData] = useState(false);
	let [expanded, setExpanded] = useState(true);
	let [chartLabels, setChartLabels] = useState([]);
	let [chartWeightData, setChartWeightData] = useState([]);
	let [entriesHaveLoaded, setEntriesHaveLoaded] = useState(false);
	
	const entries = useLiveQuery(
		//() => db.entries.orderBy('date').filter((entry) => globalState.settings.showDraftsInEntries || entry.draft !== true).reverse().offset(pagerOffset).limit(pagerLimit).toArray()
		() => {
			setEntriesHaveLoaded(false);
			const allEntriesDexieData = db.entries.orderBy('date').filter((entry) => globalState.settings.showDraftsInEntries || entry.draft !== true).reverse();
			if(showAllData) {
				return allEntriesDexieData.toArray( (data) => {
					setEntriesHaveLoaded(true);
					return data;
				});
				//return [returnArray, true];
			} else {
				return allEntriesDexieData.offset(pagerOffset).limit(pagerLimit).toArray( (data) => {
					setEntriesHaveLoaded(true);
					return data;
				});
				//return [returnArray, true];
			}
		}
		, [
			showAllData,
			pagerOffset, 
			pagerLimit
		]
	);

	useEffect( () => {
	console.log('stats component entries=');
	console.dir(entries);

	if(Array.isArray(entries) && entries) {	
		const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];	
		setChartLabels(entries.map( (entry) => {
				let curDate = new Date(entry.date);
				return months[curDate.getMonth()] + ' ' + curDate.getDate();
			}));
		setChartWeightData(entries.map( (entry) => entry.weight));
	}
	},[entries]);
	return (
		<div>
			<div>
			<button onClick={ () => setExpanded(!expanded)}>{ expanded ? 'Hide Stats' : 'Show Stats'}</button>
			<div className={expanded ? '' : 'is-hidden'}>
			<p>{entriesHaveLoaded ? 'entries have loaded!' : 'entries are loading...'}</p>
			<p>{showAllData ? 'Displaying all data' : 'Displaying data from current page only'}</p>
			<button onClick={ () => setShowAllData(!showAllData)}>{ showAllData ? 'show paginated data' : 'show all data'}</button>
			{ (!entriesHaveLoaded || !entries || entries.length < 1) && 
				<LoadingIndicator/>
			}
			{ entriesHaveLoaded && entries && entries.length > 0 &&
				<Line 
					data={{
						labels: chartLabels,
						datasets: [
							{
								label: 'Weight',
								data: chartWeightData,
								borderColor: 'rgb(255, 99, 132)',
								backgroundColor: 'rgba(255, 99, 132, 0.5)',
							}
						]
					}}
				/>
			}
			</div>
			</div>
		</div>
	);
}

export default StatsComponent;
