'use strict';

const Homey = require('homey');
const DiscoverHubs = require('./discoverhub')
var harmony = require('harmonyhubjs-client');
var deviceData;

class MyDevice extends Homey.Device {

    // this method is called when the Device is inited
    onInit() {
        deviceData = this.getData()
        this.log('device init');
        this.log('name:', this.getName());
        this.log('class:', this.getClass());
        this.log('ip: ' + deviceData.ip);

        harmony(deviceData.ip).then(function (harmonyClient) {
            return harmonyClient.getAvailableCommands()
            .then(function (commands) {
                commands.device.forEach(function(device) {
                    console.log(device.label);
                }, this);
            })
            .finally(function () {
                harmonyClient.end()
            })
        })
        .catch(function (e) {
            console.log(e)
        })

        
        // register a capability listener
       // this.registerCapabilityListener('onoff', this.onCapabilityOnoff.bind(this))
    }

    // this method is called when the Device is added
    onAdded() {
        this.log('device added');
        DiscoverHubs.stopHubDiscovery();
    }

    // this method is called when the Device is deleted
    onDeleted() {
        this.log('device deleted');
    }

    // this method is called when the Device has requested a state change (turned on or off)
    //onCapabilityOnoff( value, opts, callback ) {

        // ... set value to real device

        // Then, emit a callback ( err, result )
    //    callback( null );

        // or, return a Promise
    //    return Promise.reject( new Error('Switching the device failed!') );
    //}

}

module.exports = MyDevice;