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

function calculateMovingAverage( 
	inputDataArray:number[],
	movingAverageWindowSize: number
) {
	return inputDataArray.map( (entry, index, entries) => {
		let entriesInWindow = entries.slice(
			index-((movingAverageWindowSize-1)/2) > -1 ? index-((movingAverageWindowSize-1)/2) : 0, 
			(index+((movingAverageWindowSize-1)/2) < entries.length ? index+((movingAverageWindowSize-1)/2) : entries.length) + 1
		)
		//console.log("entriesInWindow=");
		//console.dir(entriesInWindow);
		let windowSum = entriesInWindow.reduce( (total, curVal, curIndex) => total+curVal, 0 );
		//console.log(`windowSum = ${windowSum} avg=${windowSum/entriesInWindow.length}`);
		return windowSum/entriesInWindow.length;
	});
}

function calculateMovingMedian(
	inputDataArray:number[],
	medianCalcChunkSize: number
) {
	const chunkedData = inputDataArray.toReversed().reduce( (chunks, curValue, curIndex) => {
		//console.log(`curIndex%medianCalcChunkSize=${curIndex%medianCalcChunkSize}`);	
		//console.log(`(curIndex-(curIndex%medianCalcChunkSize))/medianCalcChunkSize=${(curIndex-(curIndex%medianCalcChunkSize))/medianCalcChunkSize}`);	
		if(curIndex%medianCalcChunkSize === 0) {
			chunks.push([curValue]);	
		} else {
			chunks[(curIndex-(curIndex%medianCalcChunkSize))/medianCalcChunkSize].push(curValue);
		}
		return chunks;
	}, []);
	//console.dir(chunkedData);
	return chunkedData.map( (chunk) => {
		let sortedChunk = chunk.sort();
		let medianWeight = chunk[Math.ceil(chunk.length/2)-1];
		return chunk.map( weight => medianWeight);
	}).flat().reverse();
}

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

	let movingAverageWindowSize = 7;
	let medianCalcChunkSize = 7;
	
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

	let chartLabels = [];	
	let chartWeightData  = [];
	let chartMovingAverageWeightData = [];
	let chartMedianWeightData = [];
	let pointStyle = false;

	let activeChartDataToProcess = [];
	//setup to compute allEntriesData
	if(showAllData && Array.isArray(allEntries) && allEntries) {
		activeChartDataToProcess = allEntries;
		pointStyle = false;
	}
	//setup to compute pagedEntries data
	if(!showAllData && Array.isArray(pagedEntries) && pagedEntries) {	
		activeChartDataToProcess = pagedEntries;
		pointStyle = 'circle';
	}
	//calculate appropriate data
	if(activeChartDataToProcess && activeChartDataToProcess.length > 0) {	
		const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];	
		chartLabels = activeChartDataToProcess.map( (entry) => {
			let curDate = new Date(entry.date);
			return months[curDate.getMonth()] + ' ' + curDate.getDate();
		});
		chartWeightData = activeChartDataToProcess.map( (entry) => Number(entry.weight));
		chartMovingAverageWeightData = calculateMovingAverage(chartWeightData, movingAverageWindowSize);
		chartMedianWeightData = calculateMovingMedian(chartWeightData, medianCalcChunkSize);
	}

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
