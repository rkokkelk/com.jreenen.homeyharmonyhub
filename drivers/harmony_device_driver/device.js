'use strict';

const Homey = require('homey');

class HarmonyDevice extends Homey.Device {
    onInit() {
        this._deviceData = this.getData();
        this.registerCapabilityListener('onoff', this.onCapabilityOnoff.bind(this));
        console.log(`Device (${this._deviceData.id}) - ${this._deviceData.device.label} initializing..`)
    }

    onAdded() {
        this.log('device added');
    }

    onDeleted() {
        this.log('device deleted');
    }

    onCapabilityOnoff(value, opts, callback) {
        var powerGroup = this._deviceData.controlGroup.find(x => x.name === 'Power');
        var powerToggleFunction = powerGroup.function.find(x => x.name === 'PowerToggle');

        Homey.app.sendCommand(this._deviceData.hubId, powerToggleFunction);
        let currenOnOffState = this.getCapabilityValue('onoff');
        this.setCapabilityValue('onoff', !currenOnOffState);
    }
}

module.exports = HarmonyDevice;