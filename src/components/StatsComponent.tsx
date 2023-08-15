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
const chartOptions = {
	maintainAspectRatio: false
};

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
	let [allEntriesHaveLoaded, setAllEntriesHaveLoaded] = useState(false);
	let [pagedEntriesHaveLoaded, setPagedEntriesHaveLoaded] = useState(false);
	
	const allEntries = useLiveQuery(
		() => {
			setAllEntriesHaveLoaded(false);
  		return db.entries
				.where('isDraft')
				.equals(0)
				.reverse()
				.sortBy('date', (data) => {
					setAllEntriesHaveLoaded(true);
					return data;
				});
		}
		, [
		]
	);

	const pagedEntries = useLiveQuery(
		() => {
			setPagedEntriesHaveLoaded(false);
  		return db.entries
				.where('isDraft')
				.equals(0)
				.reverse()
				.offset(pagerOffset).limit(pagerLimit).sortBy('date', (data) => {
					setPagedEntriesHaveLoaded(true);
					return data;
				});
		}
		, [
			pagerOffset, 
			pagerLimit
		]
	);

	useEffect( () => {
	//console.log('stats component allEntries=');
	//console.dir(allEntries);

	if(showAllData && Array.isArray(allEntries) && allEntries) {	
		const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];	
		setChartLabels(allEntries.map( (entry) => {
				let curDate = new Date(entry.date);
				return months[curDate.getMonth()] + ' ' + curDate.getDate();
			}));
		setChartWeightData(allEntries.map( (entry) => entry.weight));
	}
	},[showAllData, allEntries]);
	
	useEffect( () => {
	//console.log('stats component pagedEntries=');
	//console.dir(pagedEntries);

	if(!showAllData && Array.isArray(pagedEntries) && pagedEntries) {	
		const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];	
		setChartLabels(pagedEntries.map( (entry) => {
				let curDate = new Date(entry.date);
				return months[curDate.getMonth()] + ' ' + curDate.getDate();
			}));
		setChartWeightData(pagedEntries.map( (entry) => entry.weight));
	}
	},[showAllData, pagedEntries]);
	
	return (
		<div>
			<div>
			<div className="level is-mobile mb-1">
				<div className="level-item">
					<button className="button is-info" onClick={ () => setExpanded(!expanded)}>{ expanded ? 'Hide Stats' : 'Show Stats'}</button>
				</div>
			</div>
			<div className={expanded ? '' : 'is-hidden'}>
			<div style={{position: 'relative'}} className="mb-2">
			<div style={{position: 'relative', height: '35vh'}}>
					<Line 
						options={chartOptions}
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
				className={ ( (showAllData && !allEntriesHaveLoaded ) || (!showAllData && !pagedEntriesHaveLoaded) ) ? '' : 'is-hidden'}
				>
					<LoadingIndicator style={{margin: 'auto auto'}} loadingText="Loading graph data..."/>
				</div>
			</div>
			<div className="field is-grouped">
				<div className="control">
					<button
						className="button is-info is-small" 
						onClick={ () => setShowAllData(!showAllData)}
					>
						{ showAllData ? 'Show Paged Data' : 'Show All Data'}
					</button>
				</div>
			</div>
			</div>
			</div>
		</div>
	);
}

export default StatsComponent;
