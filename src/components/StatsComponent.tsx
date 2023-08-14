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
	let [expanded, setExpanded] = useState(false);
	let [chartLabels, setChartLabels] = useState([]);
	let [chartWeightData, setChartWeightData] = useState([]);
	let [entriesHaveLoaded, setEntriesHaveLoaded] = useState(false);
	
	const entries = useLiveQuery(
		() => {
			setEntriesHaveLoaded(false);
  		const allEntriesDexieData = db.entries
				.where('isDraft')
				.equals(0)
				.reverse();
			if(showAllData) {
				return allEntriesDexieData.sortBy('date', (data) => {
					setEntriesHaveLoaded(true);
					return data;
				});
				//return [returnArray, true];
			} else {
				return allEntriesDexieData.offset(pagerOffset).limit(pagerLimit).sortBy('date', (data) => {
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
			<div className="level is-mobile mb-1">
				<div className="level-item">
					<button className="button is-info" onClick={ () => setExpanded(!expanded)}>{ expanded ? 'Hide Stats' : 'Show Stats'}</button>
				</div>
			</div>
			<div className={expanded ? '' : 'is-hidden'}>
			<p>{showAllData ? 'Displaying all data' : 'Displaying data from current page only'}</p>
			<button onClick={ () => setShowAllData(!showAllData)}>{ showAllData ? 'show paginated data' : 'show all data'}</button>
			<div style={{position: 'relative'}}>
			<div style={{position: 'relative'}}>
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
		</div>
			<div style={{
					position: 'absolute',
					top: '0',
					left: '0',
					width: '100%',
					height: '100%',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					backgroundColor: 'rgba(0,0,0,0.25)'
				}}
				className={ (!entriesHaveLoaded || !entries || entries.length < 1) ? '' : 'is-hidden'}
				>
					<LoadingIndicator style={{margin: 'auto auto'}} loadingText="Loading graph data..."/>
				</div>
			</div>
			</div>
			</div>
		</div>
	);
}

export default StatsComponent;
