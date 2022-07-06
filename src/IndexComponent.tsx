import React, { useState, useEffect } from 'react';

export default function IndexComponent() {
	return (
		<>
			<div className="columns is-mobile is-centered">
				<div className="column is-12">
					<div className="hero is-primary">
						<div className="hero-body">
    					<h2 className="title">Weight-loss Progress Pics Time-lapse Builder</h2>
							<p className="subtitle">Track weight loss and build a time-lapse of progress pictures.</p>
						</div>
					</div>
				</div>
			</div>
    	<div className="columns is-mobile is-centered">
				<div className="column is-11-mobile is-10-tablet is-8-desktop">
					<div className="content">
						<h1>Introduction</h1>
						<p>This tool allows you to track your weight loss and build a time-lapse of your progress pictures. You can align your progress pictures against each other so that the resulting time-lapse is smooth and steady despite any differences in the perspective of each picture. All data is only stored locally on your device so your information and pictures stay totally private.</p>
						<h1>How It Works</h1>
						<p>The top navigation menu guides you through the process. Starting with <strong>Entries</strong> you can add your weight-loss data and pictures as you progress. Create new entries daily, weekly, or any other time scale that works for you. The time scale doesn't have to be regular either.</p>
						<p>Once you have some entries, you can use the <strong>Adjust</strong> tab to select an image as the base for adjustments and setup the scaling/cropping. All images will ultimately be cropped, scaled, and aligned with the image selected on this tab.</p>
						<p>After selecting an adjustment image, you can use the <strong>Process</strong> tab to generate the scaled, cropped, and aligned images that are used to create the final time-lapse. This tab also provides a preview of the images so that you can ensure everything looks correct.</p>
						<p>Finally, the <strong>Export</strong> tab allows you to convert your processed entries into a video. On this tab you can control parameters about the video, including overlaying the entry information and a graph of your weight loss. Currently there is only one export method which operates locally on your device. It is marked as experimental since it doesn't always behave as expected when trying to export a video with very short frame durations (high frame rate). In the future there are plans to develop a server side export option and a method to create and host an interactive viewer for your weight loss journey.</p>
						<h1>Tips</h1>
						<p>For best results...</p>
						<ul>
							<li>Ensure all entries have an image, weight information, a date, and three alignment marks. There are validations that will let you know if they are missing.</li>
							<li>Choose consistent alignment mark points and ensure they are as consistent as possible from one image to another. Choose features that do not move between pictures. Both nipples and the bellybutton are a good choice if they are visible.</li>
							<li>Go through all the steps in the top navigation before trying to export. Make sure you have selected an image on the Adjust tab prior to trying to Process your entries.</li>
							<li>Due to how images are stored in the browser database, working with larger images can be slow. If performance is sluggish, try uploading smaller images. By default, images are scaled down so that their largest dimesion is 1920 pixels. This is governed by the <i>defaultBaseImageMaxDimension</i> setting.</li>
							<li>The data and images you upload only exist on your device. Reguarly backup your data if you want to ensure it wont be lost. See the <a href="#data_is_stored_locally">Data is Stored Locally</a> section for more information.</li>
							<li>The Settings tab shows internal data used by the tool. You should not need to edit the values presented during normal operation. This tab also has the Export/Import options used to backup/recover your data.</li>
						</ul>
						<h1>Details</h1>
						<h2 id="data_is_stored_locally">Data is Stored Locally</h2>
						<p>This tool stores all its data locally on your device using IndexedDB. This means that the data only exists on your device and if it is ever deleted it cannot be recovered. To guard against this, you can export your raw data via the <strong>Settings</strong> tab. To ensure your data is always recoverable, you can regularly export it and save it to your device. Then, if your browers IndexedDB storage ever gets cleared, you can import your latest saved data and be on your way.</p>
					</div>
				</div>
			</div>
		</>
	);
}; 
