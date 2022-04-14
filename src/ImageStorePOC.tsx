import React, { useState, useEffect, useRef } from 'react';

function ImageStorePOC() {
	let storeImageRef = useRef<HTMLButtonElement>(null);
	let imageUploadRef = useRef<HTMLInputElement>(null);
  
	useEffect( () => {
		const storeImageHandler = () => {
			console.dir(imageUploadRef.current);
			let selectedFile;
			if(imageUploadRef.current && imageUploadRef.current.files) {
				selectedFile = imageUploadRef.current.files[0];
			}
			const reader = new FileReader();
			reader.onload = (event) => {
				if(event.target && event.target.result) {
					console.log("result=", event.target.result);
					if(typeof event.target.result === "string") {
						//let newImage = document.createElement("img");
						let newImage = new Image();
						newImage.src = event.target.result;
						document.body.append(newImage);
					}
				}
			};
			if(selectedFile) {
				//reader.readAsText(selectedFile);
				reader.readAsDataURL(selectedFile);
			}
		};

		if(storeImageRef.current) {
			storeImageRef.current.addEventListener("click", storeImageHandler);
		}

		return () => {
			if(storeImageRef.current) {
				storeImageRef.current.removeEventListener("click", storeImageHandler);
			}
		}
	}, []);

	return (
    <div>
			<input ref={imageUploadRef} type="file" id="image_upload" name="image_upload"></input>
			<button ref={storeImageRef} type="button" id="store_image">Store Image</button>
    </div>
  );
}

export default ImageStorePOC;
