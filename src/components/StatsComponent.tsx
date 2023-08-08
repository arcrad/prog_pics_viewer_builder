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
	let [showAllData, setShowAllData] = useState(true);
	let [expanded, setExpanded] = useState(true);
	let [chartLabels, setChartLabels] = useState([]);
	let [chartWeightData, setChartWeightData] = useState([]);
	
	const entries = useLiveQuery(
		//() => db.entries.orderBy('date').filter((entry) => globalState.settings.showDraftsInEntries || entry.draft !== true).reverse().offset(pagerOffset).limit(pagerLimit).toArray()
		() => {
			const allEntriesDexieData = db.entries.orderBy('date').filter((entry) => globalState.settings.showDraftsInEntries || entry.draft !== true).reverse();
			if(showAllData) {
				return allEntriesDexieData.toArray();
			} else {
				return allEntriesDexieData.offset(pagerOffset).limit(pagerLimit).toArray();
			}
		}
		, [
			showAllData,
			pagerOffset, 
			pagerLimit
		]
	);

	useEffect( () => {
	if(entries) {	
	//console.log('stats component entries=');
	//console.table(entries);
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
			<p>{showAllData ? 'Displaying all data' : 'Displaying data from current page only'}</p>
			<button onClick={ () => setShowAllData(!showAllData)}>{ showAllData ? 'show paginated data' : 'show all data'}</button>
			{ (!entries || entries.length < 1) && <div> loading graph data...</div> }
			{ entries && entries.length > 0 &&
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
