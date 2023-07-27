import 
	React, 
	{ 
		useState, 
		useEffect, 
} from 'react';
import {
	useNavigate,
} from 'react-router-dom';

import ViewBaseImageComponent from './ViewBaseImageComponent';

//import styles from './ViewBaseImageModal.module.css';

type ViewBaseImageModalAttributes = {
};

function ViewBaseImageModal({} : ViewBaseImageModalAttributes ) {
	let [isLoaded, setIsLoaded] = useState(false);

	const navigate = useNavigate();

	useEffect( () => {
		document.documentElement.classList.add('is-clipped');
		return () => {
			document.documentElement.classList.remove('is-clipped');
		}
	}, []);

	let handleCloseButton = () => {
			console.log('handleCloseButton()');
			setIsLoaded(false);
			navigate('../');
	};

	return (
    <div className="modal is-active">
			<div className="modal-background">
			</div>
			<div className="modal-card">
				<div className={`modal-card-head`}>
					<h1 className="modal-card-title">View Base Image</h1>
				</div>
				<div className={`modal-card-body`}>
					<ViewBaseImageComponent
						isLoaded={isLoaded}
						setIsLoaded={setIsLoaded}
					/>
				</div>
				<div className="modal-card-foot">
					<button 
						type="button" 
						className="button"
						onClick={ handleCloseButton }
					>
							Close
					</button>
				</div>
			</div>
    </div>
  );
}

export default ViewBaseImageModal;
