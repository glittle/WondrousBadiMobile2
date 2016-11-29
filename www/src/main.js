import Vue from 'vue'
import App from './App.vue'

window.moment = require('moment');

/* eslint-disable no-new */
var Phonegap = {

	// Application Constructor
	initialize() {
		this.bindEvents()
	},

	// Bind Event Listeners
	//
	// Bind any events that are required on startup. Common events are:
	// 'load', 'deviceready', 'offline', and 'online'.
	bindEvents() {
		document.addEventListener('deviceready', this.onDeviceReady, false)
	},

	// deviceready Event Handler
	//
	// The scope of 'this' is the event. In order to call the 'receivedEvent'
	// function, we must explicitly call 'Phonegap.receivedEvent(...);'
	onDeviceReady() {
		Phonegap.receivedEvent()
	},

	onReady() {
		console.log('onReady');

		new Vue({
			el: 'body',
			components: { App }
		})
	},
	locationReady() {
		console.log('locationReady')

	},

	// Update DOM on a Received Event
	receivedEvent() {

		console.log('The device is ready!')

		sharedStartup(Phonegap.locationReady, Phonegap.onReady);

		// Load Vue instance

	}

}


Phonegap.initialize()
