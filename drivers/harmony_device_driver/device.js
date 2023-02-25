'use strict';

const Homey = require('homey');
const HubManager = require('../../lib/hubmanager.js');
const hubManager = new HubManager();

class HarmonyDevice extends Homey.Device {

    async onInit() {
        this._deviceData = this.getData();

        this.setUnavailable(`Hub ${this.homey.__('offline')}`);

        Homey.app.on(`${this._deviceData.id}_online`, (hub) => {
            this.hub = Homey.app.getHub(this._deviceData.hubId);
            this.setAvailable();
        });

        this.homey.app.on(`${this._deviceData.id}_offline`, () => {
            this.setUnavailable(`Hub ${this.homey.__('offline')}`);
        });

        this.getCapabilities().forEach(capability => {
            if (capability === 'onoff')
                this.registerCapabilityListener('onoff', (value) => {
                    return new Promise((resolve, reject) => {
                        this.onCapabilityOnoff(value).then(() => {
                            resolve();
                        }).catch((err) => {
                            console.log(err);
                            reject(err);
                        });
                    });
                });

            if (capability === 'volume_up')
                this.registerCapabilityListener('volume_up', async (value, opts) => {
                    return new Promise((resolve, reject) => {
                        console.log(`Volume up triggered on ${this._deviceData.label}`)

                        const volumeGroup = this._deviceData.controlGroup.find(x => x.name === 'Volume');
                        const volumeUpFunction = volumeGroup.function.find(x => x.name === 'VolumeUp');
                        const foundHub = this.hub;

                        hubManager.connectToHub(foundHub.ip).then((hub) => {
                            hub.commandAction(volumeUpFunction).catch((err) => {
                                console.log(err);
                                return Promise.reject(err);
                            });
                        });
                    });
                });

            if (capability === 'volume_down')
                this.registerCapabilityListener('volume_down', async (value, opts) => {
                    return new Promise((resolve, reject) => {
                        console.log(`Volume down triggered on ${this._deviceData.label}`)
                        const volumeGroup = this._deviceData.controlGroup.find(x => x.name === 'Volume');
                        const volumeDownFunction = volumeGroup.function.find(x => x.name === 'VolumeDown');
                        const foundHub = this.hub;

                        hubManager.connectToHub(foundHub.ip).then((hub) => {
                            hub.commandAction(volumeDownFunction).catch((err) => {
                                console.log(err);
                                return Promise.reject(err);
                            });
                        });
                    });
                });

            if (capability === 'volume_mute')
                this.registerCapabilityListener('volume_mute', async (value, opts) => {
                    return new Promise((resolve, reject) => {
                        console.log(`Volume mute triggered on ${this._deviceData.label}`)
                        const volumeGroup = this._deviceData.controlGroup.find(x => x.name === 'Volume');
                        const volumeMuteFunction = volumeGroup.function.find(x => x.name === 'Mute');
                        const foundHub = this.hub;

                        hubManager.connectToHub(foundHub.ip).then((hub) => {
                            hub.commandAction(volumeMuteFunction).catch((err) => {
                                console.log(err);
                                return Promise.reject(err);
                            });
                        });
                    });
                });

            if (capability === 'channel_up')
                this.registerCapabilityListener('channel_up', async (value, opts) => {
                    return new Promise((resolve, reject) => {
                        console.log(`Channel up triggered on ${this._deviceData.label}`)
                        const channelGroup = this._deviceData.controlGroup.find(x => x.name === 'Channel');
                        const channelUpFunction = channelGroup.function.find(x => x.name === 'ChannelUp');
                        const foundHub = this.hub;

                        hubManager.connectToHub(foundHub.ip).then((hub) => {
                            hub.commandAction(channelUpFunction).catch((err) => {
                                console.log(err);
                                return Promise.reject(err);
                            });
                        });
                    });
                });

            if (capability === 'channel_down')
                this.registerCapabilityListener('channel_down', async (value, opts) => {
                    return new Promise((resolve, reject) => {
                        console.log(`Channel down triggered on ${this._deviceData.label}`)
                        const channelGroup = this._deviceData.controlGroup.find(x => x.name === 'Channel');
                        const channelDownFunction = channelGroup.function.find(x => x.name === 'ChannelDown');
                        const foundHub = this.hub;

                        hubManager.connectToHub(foundHub.ip).then((hub) => {
                            hub.commandAction(channelDownFunction).catch((err) => {
                                console.log(err);
                                return Promise.reject(err);
                            });
                        });
                    });
                });

        });

        hubManager.on(`deviceInitialized_${this._deviceData.id}`, (device) => {
            this.device = device;

            device.on('stateChanged', (state) => {
                if (this.getCapabilities().find(c => c === 'onoff')) {
                    this.setCapabilityValue('onoff', state.Power === 'On');
                    this.triggerOnOffAction(state);
                }
            });
        });

        const isOnCondition = this.homey.flow.getConditionCard('is_on');
        isOnCondition
            .registerRunListener(async (args, state) => {
                const isPowerdOn = await args.hub_device.device.power === 'On';
                console.log(`Condition ${isPowerdOn}`);
                return Promise.resolve(isPowerdOn);
            });

        console.log(`Device (${this._deviceData.id}) - ${this._deviceData.label} initializing..`);
    }

    onAdded() {
        this.log('device added');
        console.log(`Device data ${this._deviceData}`);
        console.log(`Hub id ${this._deviceData.hubId}`);
        const foundHub = this.homey.app.getHub(this._deviceData.hubId);
        this.hub = foundHub;
        this.onInit();

        hubManager.connectToHub(foundHub.ip).then((hub) => {
            hub.syncHub();
        });

        this.setAvailable();
    }

    onDeleted() {
        this.log('device deleted');
        this.homey.flow.getDeviceTriggerCard('turned_on').unregister();
        this.homey.flow.getDeviceTriggerCard('turned_off').unregister();

        this.removeAllListeners();
        super.onDeleted();
    }

    triggerOnOffAction(deviceState) {
        const currenOnOffState = this.getCapabilityValue('onoff');
        const turnedOnDeviceTrigger = this.homey.flow.getDeviceTriggerCard('turned_on');
        const turnedOffDeviceTrigger = this.homey.flow.getDeviceTriggerCard('turned_off');
        const device = this;
        const foundHub = this.homey.app.getHub(this._deviceData.hubId);
        const hub = foundHub;

        if (hub !== undefined) {
            const tokens = {
                hub: hub.friendlyName
            };
            const state = {};
            const deviceTurnedOn = deviceState.Power === 'On';

            if (currenOnOffState !== deviceTurnedOn) {

                if (currenOnOffState === false)
                    turnedOnDeviceTrigger.trigger(device, tokens, state);

                else
                    turnedOffDeviceTrigger.trigger(device, tokens, state);

                this.setCapabilityValue('onoff', deviceTurnedOn);
            }
        }
    }

    onCapabilityOnoff(setOnOffState) {
        let powerGroup = this._deviceData.controlGroup.find(x => x.name === 'Power');
        const foundHub = this.hub;

        /* Could be a smart home device */
        if (powerGroup === undefined)
            powerGroup = this._deviceData.controlGroup.find(x => x.name === 'Home');

        if (powerGroup !== undefined) {
            const powerToggleFunction = powerGroup.function.find(x => x.name === 'PowerToggle');
            const powerOnFunction = powerGroup.function.find(x => x.name === 'PowerOn');
            const powerOffFunction = powerGroup.function.find(x => x.name === 'PowerOff');
            let powerCommand = '';

            if (setOnOffState)
                powerCommand = powerOnFunction !== undefined ? powerOnFunction : powerToggleFunction;

            else
                powerCommand = powerOffFunction !== undefined ? powerOffFunction : powerToggleFunction;

            // Only trigger onOff state actions if state actually changes
            const currentOnOffState = this.getCapabilityValue('onoff');
            if (currentOnOffState !== setOnOffState) {
                const deviceState = {};
                deviceState.Power = setOnOffState ? 'On' : 'Off';
                this.triggerOnOffAction(deviceState);

                hubManager.connectToHub(foundHub.ip).then((hub) => {
                    hub.commandAction(powerCommand).catch((err) => {
                        console.log(err);
                        return Promise.reject(err);
                    });
                });

                // Even if currentState eq setState, all specific on/off command may be executed
                // toggleCommands should not be executed because this might turn device in unwanted state
            } else if (powerCommand !== powerToggleFunction)
                hubManager.connectToHub(foundHub.ip).then((hub) => {
                    hub.commandAction(powerCommand).catch((err) => {
                        console.log(err);
                        return Promise.reject(err);
                    });
                });

            return Promise.resolve();
        }

        return Promise.reject();
    }

}

module.exports = HarmonyDevice;
