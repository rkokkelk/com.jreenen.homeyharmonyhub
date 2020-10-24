'use strict';

const Homey = require('homey');
const HubManager = require('../../lib/hubmanager.js');
const hubManager = new HubManager();

class HarmonyDevice extends Homey.Device {
    onInit() {
        this._deviceData = this.getData();

        this.setUnavailable(`Hub ${Homey.__("offline")}`);

        Homey.app.on(`${this._deviceData.id}_online`, (hub) => {
            this.hub = Homey.app.getHub(this._deviceData.hubId);
            this.setAvailable();
        });

        Homey.app.on(`${this._deviceData.id}_offline`, () => {
            this.setUnavailable(`Hub ${Homey.__("offline")}`);
        });

        this.getCapabilities().forEach(capability => {
            if (capability === "onoff") {
                this.registerCapabilityListener('onoff', () => {
                    return new Promise((resolve, reject) => {
                        this.onCapabilityOnoff().then(() => {
                            resolve();
                        }).catch((err) => {
                            console.log(err);
                            reject(err);
                        });
                    });
                });
            }

            if (capability === "volume_up") {
                this.registerCapabilityListener('volume_up', (value, opts, callback) => {
                    return new Promise((resolve, reject) => {
                        console.log(`Volume up triggered on ${this._deviceData.label}`)

                        let volumeGroup = this._deviceData.controlGroup.find(x => x.name === 'Volume');
                        let volumeUpFunction = volumeGroup.function.find(x => x.name === 'VolumeUp');
                        let foundHub = this.hub;

                        hubManager.connectToHub(foundHub.ip).then((hub) => {
                            hub.commandAction(volumeUpFunction).catch((err) => {
                                console.log(err);
                                return Promise.reject(err);
                            });
                        });

                        callback(null);
                    });
                });
            }

            if (capability === "volume_down") {
                this.registerCapabilityListener('volume_down', (value, opts, callback) => {
                    return new Promise((resolve, reject) => {
                        console.log(`Volume down triggered on ${this._deviceData.label}`)
                        let volumeGroup = this._deviceData.controlGroup.find(x => x.name === 'Volume');
                        let volumeDownFunction = volumeGroup.function.find(x => x.name === 'VolumeDown');
                        let foundHub = this.hub;

                        hubManager.connectToHub(foundHub.ip).then((hub) => {
                            hub.commandAction(volumeDownFunction).catch((err) => {
                                console.log(err);
                                return Promise.reject(err);
                            });
                        });

                        callback(null);
                    });
                });
            }

            if (capability === "volume_mute") {
                this.registerCapabilityListener('volume_mute', (value, opts, callback) => {
                    return new Promise((resolve, reject) => {
                        console.log(`Volume mute triggered on ${this._deviceData.label}`)
                        let volumeGroup = this._deviceData.controlGroup.find(x => x.name === 'Volume');
                        let volumeMuteFunction = volumeGroup.function.find(x => x.name === 'Mute');
                        let foundHub = this.hub;

                        hubManager.connectToHub(foundHub.ip).then((hub) => {
                            hub.commandAction(volumeMuteFunction).catch((err) => {
                                console.log(err);
                                return Promise.reject(err);
                            });
                        });

                        callback(null);
                    });
                });
            }

            if (capability === "channel_up") {
                this.registerCapabilityListener('channel_up', (value, opts, callback) => {
                    return new Promise((resolve, reject) => {
                        console.log(`Channel up triggered on ${this._deviceData.label}`)
                        let channelGroup = this._deviceData.controlGroup.find(x => x.name === 'Channel');
                        let channelUpFunction = channelGroup.function.find(x => x.name === 'ChannelUp');
                        let foundHub = this.hub;

                        hubManager.connectToHub(foundHub.ip).then((hub) => {
                            hub.commandAction(channelUpFunction).catch((err) => {
                                console.log(err);
                                return Promise.reject(err);
                            });
                        });

                        callback(null);
                    });
                });
            }

            if (capability === "channel_down") {
                this.registerCapabilityListener('channel_down', (value, opts, callback) => {
                    return new Promise((resolve, reject) => {
                        console.log(`Channel down triggered on ${this._deviceData.label}`)
                        let channelGroup = this._deviceData.controlGroup.find(x => x.name === 'Channel');
                        let channelDownFunction = channelGroup.function.find(x => x.name === 'ChannelDown');
                        let foundHub = this.hub;

                        hubManager.connectToHub(foundHub.ip).then((hub) => {
                            hub.commandAction(channelDownFunction).catch((err) => {
                                console.log(err);
                                return Promise.reject(err);
                            });
                        });

                        callback(null);
                    });
                });
            }
        });

        hubManager.on(`deviceInitialized_${this._deviceData.id}`, (device) => {
            this.device = device;

            device.on('stateChanged', (state) => {
                if (this.getCapabilities().find(c => c === "onoff")) {
                    this.setCapabilityValue('onoff', state.Power === 'On');
                    this.triggerOnOffAction(state);
                }
            });
        });

        let isOnCondition = new Homey.FlowCardCondition('is_on');
        isOnCondition
            .register()
            .registerRunListener((args, state) => {
                let isPowerdOn = args.hub_device.device.power === 'On';
                console.log(`Condition ${isPowerdOn}`);
                return Promise.resolve(isPowerdOn);
            });
            
        console.log(`Device (${this._deviceData.id}) - ${this._deviceData.label} initializing..`);
    }

    onAdded() {
        this.log('device added');
        let foundHub = Homey.app.getHub(this._deviceData.hubId);
        this.hub = foundHub;
        if (this.getCapabilities().find(c => c === "onoff")) {
            hubManager.connectToHub(foundHub.ip).then((hub) => {
                let deviceInCurrentActivity = hub.currentActivity.fixit[this._deviceData.id];

                if (deviceInCurrentActivity.Power === "On") {
                    this.setCapabilityValue('onoff', true);
                }
                else {
                    this.setCapabilityValue('onoff', false);
                }
            });
        }

        this.setAvailable();
    }

    onDeleted() {
        this.log('device deleted');
    }

    triggerOnOffAction(deviceState) {
        let currenOnOffState = this.getCapabilityValue('onoff');
        let turnedOnDeviceTrigger = new Homey.FlowCardTriggerDevice('turned_on').register();
        let turnedOffDeviceTrigger = new Homey.FlowCardTriggerDevice('turned_off').register();
        let device = this;
        let hub = this.hub;
        let tokens = {
            'hub': hub.friendlyName
        };
        let state = {};
        let deviceTurnedOn = deviceState.Power === 'On';

        if (currenOnOffState !== deviceTurnedOn) {

            if (currenOnOffState === false) {
                turnedOnDeviceTrigger.trigger(device, tokens, state);
            }
            else {
                turnedOffDeviceTrigger.trigger(device, tokens, state);
            }

            this.setCapabilityValue('onoff', deviceTurnedOn);
        }
    }

    onCapabilityOnoff() {
        let powerGroup = this._deviceData.controlGroup.find(x => x.name === 'Power');
        let foundHub = this.hub;

        /* Could be a smart home device */
        if (powerGroup === undefined) {
            powerGroup = this._deviceData.controlGroup.find(x => x.name === 'Home');
        }

        if (powerGroup !== undefined) {
            let currenOnOffState = this.getCapabilityValue('onoff');
            let powerToggleFunction = powerGroup.function.find(x => x.name === 'PowerToggle');
            let powerOnFunction = powerGroup.function.find(x => x.name === 'PowerOn');
            let powerOffFunction = powerGroup.function.find(x => x.name === 'PowerOff');
            let powerCommand = '';

            if (currenOnOffState) {
                powerCommand = powerOffFunction !== undefined ? powerOffFunction : powerToggleFunction;
            }
            else {
                powerCommand = powerOnFunction !== undefined ? powerOnFunction : powerToggleFunction;
            }

            hubManager.connectToHub(foundHub.ip).then((hub) => {
                hub.commandAction(powerCommand).catch((err) => {
                    console.log(err);
                    return Promise.reject(err);
                });
            });

            let deviceState = {};
            deviceState.Power = 'Off'
            if (!currenOnOffState) {
                deviceState.Power = 'On';
            }

            this.triggerOnOffAction(deviceState);

            return Promise.resolve();
        }

        return Promise.reject();
    }
}

module.exports = HarmonyDevice;