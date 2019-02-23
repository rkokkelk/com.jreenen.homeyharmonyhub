'use strict';

const Homey = require('homey');
const HubManager = require('../../lib/hubmanager.js');
const hubManager = new HubManager();

class HarmonyActivity extends Homey.Device {
    onInit() {
        this._deviceData = this.getData();

        this.setUnavailable(`Hub ${Homey.__("offline")}`);

        Homey.app.on(`${this._deviceData.id}_online`, (hub) => {
            this.hub = hub;
            this.setAvailable();
        });

        Homey.app.on(`${this._deviceData.id}_offline`, () => {
            this.setUnavailable(`Hub ${Homey.__("offline")}`);
        });

        hubManager.on('activityChanged', (activityName, hubId) => {
            if (hubId !== this.hub.uuid) {
                return;
            }

            if (activityName === this._deviceData.label) {
                this.setCapabilityValue('onoff', true);
            }
            else {
                this.setCapabilityValue('onoff', false);
            }
        });

        this.registerCapabilityListener('onoff', (turnon, opts, callback) => {
            console.log(`ON/OFF triggered on ${this._deviceData.label}`);
            let foundHub = this.hub;

            hubManager.connectToHub(foundHub.ip).then((hub) => {
                if (turnon) {
                    hub.startActivity(this._deviceData.id).catch((err) => {
                        console.log(err);
                        return Promise.reject(err);
                    });
                }
                else {
                    hub.stopActivity().catch((err) => {
                        console.log(err);
                        return Promise.reject(err);
                    });
                }

                callback(null);
            });
        });

        this.getCapabilities().forEach(capability => {
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

        console.log(`Activity (${this._deviceData.id}) - ${this._deviceData.label} initializing..`);
    }

    onAdded() {
        this.log('activity added');
        let foundHub = Homey.app.getHub(this._deviceData.hubId);
        hubManager.connectToHub(foundHub.ip).then((hub) => {
            if (hub.currentActivity.label === this._deviceData.label) {
                this.setCapabilityValue('onoff', true);
            }
            else {
                this.setCapabilityValue('onoff', false);
            }
        });

        this.setAvailable();
    }

    onDeleted() {
        this.log('activity deleted');
    }

}

module.exports = HarmonyActivity;