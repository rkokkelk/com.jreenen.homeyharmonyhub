'use strict';

const Homey = require('homey');
const HarmonyHubDiscover = require('harmonyhubjs-discover')
class MyApp extends Homey.App {
	
	onInit() {
		
		this.log('MyApp is running...');
		//discover.start()
		
	}
	
}

module.exports = MyApp;