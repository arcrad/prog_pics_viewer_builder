import 
	React,
	{
		useState,
		useRef,
		useEffect
	}
from 'react';
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type StatsComponentProps = {
	data: any;
	expanded: boolean;
};

function StatsComponent({
	data,
	expanded
}: StatsComponentProps) {
	return (
		<div>
			<p>stats {expanded}</p>
			<Line data={data} />
		</div>
	);
}

export default StatsComponent;
