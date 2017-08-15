'use strict';

const Homey = require('homey');

class HarmonyDeviceDriver extends Homey.Driver {

    onInit() {
        console.log("Harmony device driver initializing...");
    }

    onPair(socket) {
        let state = {
			connected	: true,
			hub		: undefined
        };
        
        socket.on('select_hub', function (data, callback) {
            let result = [];
            let bridges = Homey.app.getHubs();
            bridges.forEach(function (bridge) {
                result.push({
                    id: bridge.uuid,
                    name: bridge.friendlyName
                })
            }, this);

            callback(null, result);
        });

        socket.on('hub_changed', function (data, callback) {
            state.hub = Homey.app.getHub(data.logitech_hubId);
        });

        socket.on('list_devices', function (data, callback){
            console.log('List devices started...')
            Homey.app.getHubDevices(state.hub.ip, state.hub.uuid).then(function(devices){
                callback( null, devices);
            });
                        
        })
    }
}

module.exports = HarmonyDeviceDriver;