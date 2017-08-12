'use strict';
const Homey = require('homey');
const HarmonyHubDiscover = require("harmonyhubjs-discover");
const Harmony = require("harmonyhubjs-client");

var discover = new HarmonyHubDiscover(61991)
var hubs = [];
var discoveryRunning = false;

discover.on('online', function(hub) {
    // Triggered when a new hub was found
    var hasFriendlyName = hub.friendlyName != undefined;
    var found = hubs.some(function (existingHub) {
        return existingHub.uuid === hub.uuid;
    });
    
    // Only add hub to list if it does have a friendly name and is not already in the list
    if(hasFriendlyName && !found)
    {
        hubs.push(hub)
        console.log('discovered ' + hub.ip + ' ' + hub.friendlyName)
    }
})

discover.on('offline', function(hub) {
	// Triggered when a hub disappeared
	console.log('lost ' + hub.ip)
})

discover.on('update', function(hubs) {
	// Combines the online & update events by returning an array with all known
	// hubs for ease of use.
	var knownHubIps = hubs.reduce(function(prev, hub) {
			return prev + (prev.length > 0 ? ', ' : '') + hub.ip
		}, '')

	console.log('known ips: ' + knownHubIps)
})

function startHubDiscovery(){
    console.log("Starting hub discovery");
    discoveryRunning = true;
    discover.start();
}

function stopHubDiscovery(){
    if(discoveryRunning == true)
    {
        console.log("Stopping hub discovery");
        discover.stop();
        discoveryRunning = false;
    }
}

module.exports = {
    startHubDiscovery: startHubDiscovery, 
    stopHubDiscovery: stopHubDiscovery,
    hubs: hubs
};