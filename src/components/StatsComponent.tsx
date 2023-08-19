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
	
	let [allEntriesHaveLoaded, setAllEntriesHaveLoaded] = useState(false);
	let [pagedEntriesHaveLoaded, setPagedEntriesHaveLoaded] = useState(false);

	let [pointStyle, setPointStyle] = useState('circle');
	let [chartLabels, setChartLabels] = useState([]);
	let [chartWeightData, setChartWeightData] = useState([]);
	let [chartMovingAverageWeightData, setChartMovingAverageWeightData] = useState([]);
	let [chartMedianWeightData, setChartMedianWeightData] = useState([]);

	let movingAverageWindowSize = 7;
	
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
			setChartMovingAverageWeightData(allEntries.map( (entry, index, entries) => {
				let entriesInWindow = entries.slice(
					index-((movingAverageWindowSize-1)/2) > -1 ? index-((movingAverageWindowSize-1)/2) : 0, 
					(index+((movingAverageWindowSize-1)/2) < entries.length ? index+((movingAverageWindowSize-1)/2) : entries.length) + 1
				)
				//console.log("entriesInWindow=");
				//console.dir(entriesInWindow);
				let windowSum = entriesInWindow.reduce( (total, curVal, curIndex) => total+Number(curVal.weight), 0 );
				//console.log(`windowSum = ${windowSum} avg=${windowSum/entriesInWindow.length}`);
				return windowSum/entriesInWindow.length;
			}));
			let chunkSize = 7;
			let chunkedWeightData = allEntries.map( entry => Number(entry.weight)).reduce( (chunks, curWeight, curIndex, allEntries) => {
				//console.log(`curIndex%chunkSize=${curIndex%chunkSize}`);	
				//console.log(`(curIndex-(curIndex%chunkSize))/chunkSize=${(curIndex-(curIndex%chunkSize))/chunkSize}`);	
				if(curIndex%chunkSize === 0) {
					chunks.push([curWeight]);	
				} else {
					chunks[(curIndex-(curIndex%chunkSize))/chunkSize].push(curWeight);
				}
				return chunks;
			}, []);
			//console.dir(chunkedWeightData);
			setChartMedianWeightData(chunkedWeightData.map( (chunk) => {
					let sortedChunk = chunk.sort();
					let medianWeight = chunk[Math.ceil(chunkSize/2)];
					return chunk.map( weight => medianWeight);
			}).flat());
			//console.dir(chartMedianWeightData);
			setPointStyle(false);
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
		setChartMovingAverageWeightData(pagedEntries.map( (entry, index, entries) => {
			let entriesInWindow = entries.slice(
				index-((movingAverageWindowSize-1)/2) > -1 ? index-((movingAverageWindowSize-1)/2) : 0, 
				(index+((movingAverageWindowSize-1)/2) < entries.length ? index+((movingAverageWindowSize-1)/2) : entries.length) + 1
			)
			//console.log("entriesInWindow=");
			//console.dir(entriesInWindow);
			let windowSum = entriesInWindow.reduce( (total, curVal, curIndex) => total+Number(curVal.weight), 0 );
			//console.log(`windowSum = ${windowSum} avg=${windowSum/entriesInWindow.length}`);
			return windowSum/entriesInWindow.length;
		}));
		setPointStyle('circle');
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
									label: '7-Day Average',
									data: chartMovingAverageWeightData,
									borderColor: 'rgb(128, 64, 192)',
									backgroundColor: 'rgba(55, 99, 232, 0.5)',
									pointStyle: pointStyle 
								},
								{
									label: 'Median Weight',
									data: chartMedianWeightData,
									borderColor: 'rgb(55, 192, 100)',
									backgroundColor: 'rgba(65, 188, 121, 0.5)',
									pointStyle: pointStyle
								},
								{
									label: 'Weight',
									data: chartWeightData,
									borderColor: 'rgb(255, 99, 132)',
									backgroundColor: 'rgba(255, 99, 132, 0.5)',
									pointStyle: pointStyle
								},
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
