import 
	React,
	{
		useState,
		useRef,
		useEffect
	}
from 'react';

type StatsComponentProps = {
	expanded: boolean;
};

function StatsComponent({
	expanded
}: StatsComponentProps) {
	return (
		<div>
			<p>stats {expanded}</p>
		</div>
	);
}

export default StatsComponent;
