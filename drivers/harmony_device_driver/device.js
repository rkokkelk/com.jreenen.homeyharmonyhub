'use strict';

const Homey = require('homey');

class HarmonyDevice extends Homey.Device {
    onInit() {
        this._deviceData = this.getData();
        this._deviceData.controlGroup.forEach(function (group) {
            console.log(group.name);
        }, this);

        this.setOnOff();
        this.registerCapabilityListener('onoff', this.onCapabilityOnoff.bind(this))
        console.log(this.getCapabilityValue('onoff'));
    }

    onAdded() {
        this.log('device added');
    }

    onDeleted() {
        this.log('device deleted');
    }

    setOnOff() {
        var powerGroup = this._deviceData.controlGroup.find(x => x.name.toLowerCase() === 'power');
        console.log(JSON.stringify(this._deviceData.device));
        console.log(`Power value: ${powerGroup.value}`);
    }

    onCapabilityOnoff(value, opts, callback) {
        var powerGroup = this._deviceData.controlGroup.find(x => x.name === 'Power');
        var powerToggleFunction = powerGroup.function.find(x => x.name === 'PowerToggle');
        
        Homey.app.sendCommand(this._deviceData.hubId, powerToggleFunction);
    }
}

module.exports = HarmonyDevice;