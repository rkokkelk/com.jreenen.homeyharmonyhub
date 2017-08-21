'use strict';

const Homey = require('homey');

class HarmonyDevice extends Homey.Device {
    onInit() {
        this._deviceData = this.getData();
        this.registerCapabilityListener('onoff', this.onCapabilityOnoff.bind(this));
        console.log(`Device (${this._deviceData.id}) - ${this._deviceData.device.label} initializing..`);
    }

    onAdded() {
        this.log('device added');
    }

    onDeleted() {
        this.log('device deleted');
    }

    triggerOnOffAction(){
        let currenOnOffState = this.getCapabilityValue('onoff');
        let turnedOnDeviceTrigger = new Homey.FlowCardTriggerDevice('turned_on').register();
        let turnedOffDeviceTrigger = new Homey.FlowCardTriggerDevice('turned_off').register();
        let device = this;
        let hub = Homey.app.getHub(this._deviceData.hubId);
		let tokens = {
			'hub': hub.friendlyName
        };
        
        let state = {};

        if(currenOnOffState === false){
            turnedOnDeviceTrigger.trigger(device, tokens, state);
        }
        else{
            turnedOffDeviceTrigger.trigger(device, tokens, state);
        }

    }

    onCapabilityOnoff(value, opts, callback) {
        var powerGroup = this._deviceData.controlGroup.find(x => x.name === 'Power');
        if (powerGroup !== undefined) {
            var powerToggleFunction = powerGroup.function.find(x => x.name === 'PowerToggle');

            Homey.app.sendCommand(this._deviceData.hubId, powerToggleFunction);
            let currenOnOffState = this.getCapabilityValue('onoff');
            this.setCapabilityValue('onoff', !currenOnOffState);
            this.triggerOnOffAction();
        }
    }
}

module.exports = HarmonyDevice;