'use strict';

const Homey = require('homey');

class HarmonyDeviceDriver extends Homey.Driver {
    onInit() {
        console.log("Harmony device driver initializing...");
    }

    onPair(socket) {
        let state = {
            connected: true,
            hub: undefined
        };

        socket.on('select_hub', function (data, callback) {
            let result = [];
            let hubs = Homey.app.getHubs();
            hubs.forEach(function (hub) {
                result.push({
                    id: hub.uuid,
                    name: hub.friendlyName,
                    icon: hub.icon
                })
            }, this);

            callback(null, result);
        });

        socket.on('hub_changed', function (data, callback) {
            state.hub = Homey.app.getHub(data.logitech_hubId);
        });

        socket.on('list_devices', function (data, callback) {
            console.log('List devices started...')
            Homey.app.getHubDevices(state.hub.ip, state.hub.uuid).then((devices) => {
                console.log(devices);
       
                callback(null, devices);
            });

        })
    }
}

module.exports = HarmonyDeviceDriver;