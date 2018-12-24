'use strict';

const Homey = require('homey');
const HubManager = require('../../lib/hubmanager.js');
const Hub = require('../../lib/hub.js')
const hubManager = new HubManager();

class HarmonyVirtualTelevision extends Homey.Device {
    onInit() {
        this._deviceData = this.getData();


        this.registerCapabilityListener('onoff', (turnon) => {
            return new Promise((resolve, reject) => {
                console.log('ON/OFF triggered');
                console.log(turnon);
                let foundHub = Homey.app.getHub(this._deviceData.hubId);

                hubManager.connectToHub(foundHub.ip).then((hub) => {
                    if (turnon) {
                        hub.startActivity(this._deviceData.id).catch((err) => {
                            console.log(err);
                            return Promise.reject();
                        });
                    }
                    else {
                        hub.stopActivity().catch((err) => {
                            console.log(err);
                            return Promise.reject();
                        });
                    }
                });

            });
        });

        this.registerCapabilityListener('volume_up', () => {
            return new Promise((resolve, reject) => {
                console.log('Volume up triggered')

                let volumeGroup = this._deviceData.controlGroup.find(x => x.name === 'Volume');
                let volumeUpFunction = volumeGroup.function.find(x => x.name === 'VolumeUp');
                let foundHub = Homey.app.getHub(this._deviceData.hubId);

                hubManager.connectToHub(foundHub.ip).then((hub) => {
                    hub.commandAction(volumeUpFunction).catch((err) => {
                        console.log(err);
                        return Promise.reject();
                    });
                });
                return Promise.resolve();
            });
        });

        this.registerCapabilityListener('volume_down', () => {
            return new Promise((resolve, reject) => {
                console.log('Volume down triggered')
                let volumeGroup = this._deviceData.controlGroup.find(x => x.name === 'Volume');
                let volumeDownFunction = volumeGroup.function.find(x => x.name === 'VolumeDown');
                let foundHub = Homey.app.getHub(this._deviceData.hubId);

                hubManager.connectToHub(foundHub.ip).then((hub) => {
                    hub.commandAction(volumeDownFunction).catch((err) => {
                        console.log(err);
                        return Promise.reject();
                    });
                });
                return Promise.resolve();
            });
        });

        this.registerCapabilityListener('volume_mute', () => {
            return new Promise((resolve, reject) => {
                console.log('Volume mute triggered')
                let volumeGroup = this._deviceData.controlGroup.find(x => x.name === 'Volume');
                let volumeMuteFunction = volumeGroup.function.find(x => x.name === 'Mute');
                let foundHub = Homey.app.getHub(this._deviceData.hubId);

                hubManager.connectToHub(foundHub.ip).then((hub) => {
                    hub.commandAction(volumeMuteFunction).catch((err) => {
                        console.log(err);
                        return Promise.reject();
                    });
                });
                return Promise.resolve();
            });
        });

        this.registerCapabilityListener('channel_up', () => {
            return new Promise((resolve, reject) => {
                console.log('Channel up triggered')
                let channelGroup = this._deviceData.controlGroup.find(x => x.name === 'Channel');
                let channelUpFunction = channelGroup.function.find(x => x.name === 'ChannelUp');
                let foundHub = Homey.app.getHub(this._deviceData.hubId);

                hubManager.connectToHub(foundHub.ip).then((hub) => {
                    hub.commandAction(channelUpFunction).catch((err) => {
                        console.log(err);
                        return Promise.reject();
                    });
                });
                return Promise.resolve();
            });
        });

        this.registerCapabilityListener('channel_down', () => {
            return new Promise((resolve, reject) => {
                console.log('Channel down triggered')
                let channelGroup = this._deviceData.controlGroup.find(x => x.name === 'Channel');
                let channelDownFunction = channelGroup.function.find(x => x.name === 'ChannelDown');
                let foundHub = Homey.app.getHub(this._deviceData.hubId);

                hubManager.connectToHub(foundHub.ip).then((hub) => {
                    hub.commandAction(channelDownFunction).catch((err) => {
                        console.log(err);
                        return Promise.reject();
                    });
                });
                return Promise.resolve();
            });
        });

        console.log(`Virtual TV (${this._deviceData.id}) - ${this._deviceData.label} initializing..`);
    }

    onAdded() {
        this.log('virtual tv added');
    }

    onDeleted() {
        this.log('virtual tv deleted');
    }

}

module.exports = HarmonyVirtualTelevision;