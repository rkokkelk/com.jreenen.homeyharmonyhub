'use strict';

const Homey = require('homey');
const DiscoverHubs = require('./discoverhub')
let hubDiscovery = DiscoverHubs.startHubDiscovery();

class HarmonyHubDriver extends Homey.Driver {
    onInit() {
        console.log("Harmony hub driver initializing...");
    }

    onPairListDevices( data, callback ){
        var hubs = DiscoverHubs.hubs;
        while(hubs == undefined)
        {
            hubs = DiscoverHubs.hubs;
        }

        var devices = []
        for (var i = 0, len = DiscoverHubs.hubs.length; i < len; i++) {
            console.log(hubs[i].friendlyName)
            console.log(hubs[i].uuid)
            var device = {
                name: hubs[i].friendlyName,
                data: {
                    id: hubs[i].uuid,
                    ip: hubs[i].ip
                }
            };

            devices.push(device);
        }
        
        callback( null, devices);
    }

}

module.exports = HarmonyHubDriver;