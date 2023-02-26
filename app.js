'use strict';
const inspector = require('inspector');
const Homey = require('homey');
const HubManager = require('./lib/hubmanager.js');
const Discovery = require('./lib/discovery.js');
const CapabilityHelper = require('./lib/capabilityhelper.js');
const https = require('https');
const { URL } = require('url');

const events = require('events');
const eventEmitter = new events.EventEmitter();
const capabilityhelper = new CapabilityHelper();

const iconsMap = {
    AirConditioner: 'Air Conditioner.svg',
    Amplifier: 'Amplifier.svg',
    AppleTV: 'Apple TV.svg',
    AudioVideoSwitch: 'Audio Video Switch.svg',
    AutomationGateway: 'Automation gateway.svg',
    Blinds: 'Blinds.svg',
    MiniSystemCDRadioCassette: 'Boombox.svg',
    MiniSystemDvdCDRadio: 'Boombox.svg',
    MiniSystemDvdVcrRadio: 'Boombox.svg',
    Camera: 'Camera.svg',
    CDPlayer: 'CD Player.svg',
    TVDVD: 'Clasic Television.svg',
    TVDVDVCR: 'Clasic Television.svg',
    TVHDD: 'Clasic Television.svg',
    TVVCR: 'Clasic Television.svg',
    ClimateControl: 'Climate Control.svg',
    Computer: 'Computer.svg',
    DAT: 'Digital Audio Cassette.svg',
    Dimmer: 'Dimmer.svg',
    DoorLock: 'Doorlock.svg',
    DVDRVCR: 'DVD Player.svg',
    DVDRecorder: 'DVD Player.svg',
    DVDVCR: 'DVD Player.svg',
    DVD: 'DVD.svg',
    Fan: 'Fan.svg',
    GameConsole: 'Game Console.svg',
    GameConsoleWithDvd: 'Game Console.svg',
    StereoReceiver: 'Hi-Fi Stereo.svg',
    HomeAppliance: 'Home Appliances.svg',
    Controller: 'Home Automation.svg',
    CDJukebox: 'Jukebox.svg',
    Laptop: 'Laptop.svg',
    LaserdiscPlayer: 'Laser Disc.svg',
    LightController: 'Light controller.svg',
    MediaPlayer: 'Media Player.svg',
    MinidiscPlayer: 'Mini disk.svg',
    Monitor: 'Monitor.svg',
    DigitalMusicServer: 'Music server.svg',
    Plug: 'Plug.svg',
    ProjectorScreen: 'Projector Screen.svg',
    Projector: 'Projector.svg',
    RadioTuner: 'Radio.svg',
    PVR: 'PVR.svg',
    Satellite: 'Satelite Dish.svg',
    Sensor: 'Sensor.svg',
    CableBox: 'Set-top box.svg',
    DigitalSetTopBox: 'Set-top box.svg',
    SmokeDetector: 'Smoke Detector.svg',
    Television: 'Television.svg',
    Thermostat: 'Thermostat.svg',
    Nest: 'Thermostat.svg',
    VCR: 'VCR.svg',
    TVCamera: 'Video Camera.svg'
}

class App extends Homey.App {

    async onInit() {
        console.log(`${Homey.manifest.id} running...`);

        Homey.app = this.homey.app;

        if (process.env.DEBUG === '1')
            inspector.open(8080, '0.0.0.0', true)

        this._hubs = [];
        this._activities = [];
        this._hubManager = new HubManager(this.homey);
        this._discover = new Discovery(this._hubManager, this.homey);

        this.wireEvents();
        this.registerActions();
    }

    wireEvents() {
        this._discover.on('hubconnected', hub => {
            const found = this._hubs.some((existingHub) => {
                return existingHub.uuid === hub.uuid;
            });

            if (found === false && hub.ip !== undefined && hub.friendlyName !== undefined) {
                hub.Hub = this._hubManager.connectToHub(hub.ip);
                this.addHub(hub);
            }

            if (hub.friendlyName !== undefined)
                this.emit('hubonline', hub, true);

        });

        this._hubManager.on('activityChanged', (activityName, hubId) => {
            console.log(activityName);
            console.log(hubId);
            const foundHub = this.getHub(hubId);

            if (foundHub === undefined)
                return;

            const tokens = {
                hub: foundHub.friendlyName,
                activity: activityName
            }

            const activityStartedTrigger = this.homey.flow.getTriggerCard('activity_started');
            activityStartedTrigger.trigger(tokens)
        });

        this._hubManager.on('inactivitytime', (seconds, hubId, hubInstance) => {
            const state = { inactivefor: seconds }
            const foundHub = this.getHub(hubId);

            if (foundHub === undefined)
                return;

            const tokens = {
                hub: foundHub.friendlyName
            }

            const inactiveTrigger = this.homey.flow.getTriggerCard('hub_inactive')
            inactiveTrigger.trigger(tokens, state);
        })

        this._hubManager.on('activityChanging', (activityName, hubId) => {
            console.log(activityName);
            console.log(hubId);
            const foundHub = this.getHub(hubId);

            if (foundHub === undefined)
                return;

            const tokens = {
                hub: foundHub.friendlyName,
                activity: activityName
            }

            this._activityStartingTrigger = this.homey.flow.getTriggerCard('activity_starting');
            this._activityStartingTrigger.trigger(tokens)

        });

        this._hubManager.on('activityStopped', (activityName, hubId) => {
            const foundHub = this.getHub(hubId);

            if (foundHub === undefined)
                return;

            const tokens = {
                hub: foundHub.friendlyName,
                activity: activityName
            }

            this._activityStoppedTrigger = this.homey.flow.getTriggerCard('activity_stopped');

            this._activityStoppedTrigger.trigger(tokens)
        });
    }

    findHubs() {
        console.log('Finding hubs....')
        this._discover.start();
    }

    addHub(hub) {
        const hasFriendlyName = hub.friendlyName !== undefined;

        if (hasFriendlyName) {
            hub.icon = `/app/${Homey.manifest.id}/assets/icon.svg`;
            this._hubs.push(hub);
            console.log(`discovered ${hub.ip} ${hub.friendlyName} ${hub.uuid}`);

            eventEmitter.emit('hubAdded', hub);
        }
    }

    getHub(hubId) {
        const foundHub = this._hubs.find(x => x.uuid === hubId);

        if (foundHub === undefined)
            console.log(`No hub found with id ${hubId}`)

        return foundHub;
    }

    getHubs() {
        return this._hubs;
    }

    getHubActivities(ip, hubId) {
        const activities = [];

        return new Promise((resolve, reject) => {
            this._hubManager.connectToHub(ip).then((hub) => {
                hub.activities.forEach((activity) => {
                    if (activity.controlGroup !== undefined)
                        capabilityhelper.getCapabilities(activity.controlGroup).then((capabilities) => {
                            capabilities.push('onoff');
                            if (activity.type === 'VirtualTelevisionN') {
                                const foundDevice = {
                                    name: activity.label,
                                    class: 'tv',
                                    capabilities,
                                    data: {
                                        id: activity.id,
                                        hubId,
                                        controlGroup: activity.controlGroup,
                                        label: activity.label
                                    }
                                };

                                activities.push(foundDevice);
                            } else {
                                const foundDevice = {
                                    name: activity.label,
                                    capabilities,
                                    data: {
                                        id: activity.id,
                                        hubId,
                                        controlGroup: activity.controlGroup,
                                        label: activity.label
                                    }
                                };

                                activities.push(foundDevice);
                            }
                        });

                });
                resolve(activities);
            });
        });
    }

    getHubDevices(ip, hubId) {
        const devices = [];

        return new Promise((resolve, reject) => {
            this._hubManager.connectToHub(ip).then((hub) => {
                hub.devices.forEach((device) => {
                    capabilityhelper.getCapabilities(device.controlGroup).then((capabilities) => {
                        console.log(device.type);
                        const iconName = iconsMap[device.type];
                        let iconPath = '';
                        if (iconName !== undefined)
                            iconPath = `/device_icons/${iconName}`;

                        else
                            iconPath = '/icon.svg';

                        const foundDevice = {
                            name: device.label,
                            icon: iconPath,
                            capabilities,
                            data: {
                                id: device.id,
                                hubId,
                                controlGroup: device.controlGroup,
                                label: device.label
                            }
                        };
                        devices.push(foundDevice);
                    })
                });
                resolve(devices);
            });
        });
    }

    registerActions() {
        const sendCommandAction = this.homey.flow.getActionCard('send_command');

        this.controlGroupAutoComplete(sendCommandAction);
        this.commandAutocomplete(sendCommandAction);
        this.registerSendCommandRunListener(sendCommandAction);

        const startActivityAction = this.homey.flow.getActionCard('start_activity');
        this.hubAutoComplete(startActivityAction);
        this.activityAutoComplete(startActivityAction);
        this.registerStartActivityCommandRunListener(startActivityAction);

        const stopActivityAction = this.homey.flow.getActionCard('stop_activity');
        this.hubAutoComplete(stopActivityAction);
        this.registerStopActivityCommandRunListener(stopActivityAction);

        const isActivityCondition = this.homey.flow
            .getConditionCard('is_activity')
            .registerRunListener((args, state) => {
                console.log(args.activity_input);
                console.log(args.activity.name)
                const isActivity = args.activity_input.trim() === args.activity.name.trim();
                console.log(isActivity);
                return Promise.resolve(isActivity);
            });
        this.hubAutoComplete(isActivityCondition);
        this.activityAutoComplete(isActivityCondition);

        this.homey.flow.getTriggerCard('hub_inactive')
            .registerRunListener((args, state) => {
                // TODO: verify the result of not using this functionality
                // if (state.inactivefor >= args.inactivefor)
                //    hubInstance.lastActivity = Date.now();

                return Promise.resolve(state.inactivefor >= args.inactivefor);
            })

    }

    registerStopActivityCommandRunListener(stopActivityAction) {
        stopActivityAction
            .registerRunListener((args, state) => {
                console.log('Stop activity!!');
                const hubArgValue = args.hub;
                const hubId = hubArgValue.hubId;
                const foundHub = this.getHub(hubId);

                return new Promise((resolve, reject) => {
                    if (foundHub === undefined)
                        return reject();

                    this._hubManager.connectToHub(foundHub.ip).then((hub) => {
                        hub.stopActivity().then(() => {
                            resolve();
                        }).catch((err) => {
                            console.log(err);
                            reject(err);
                        });
                    }).catch((err) => {
                        console.log(err);
                        reject(err);
                    });
                });
            })
    }

    registerStartActivityCommandRunListener(startActivityAction) {
        startActivityAction
            .registerRunListener((args, state) => {
                console.log('Start activity!!');
                const hubArgValue = args.hub;
                const hubId = hubArgValue.hubId;
                const activityId = args.activity.activityId;
                const foundHub = this.getHub(hubId);

                return new Promise((resolve, reject) => {
                    if (foundHub === undefined)
                        return reject();

                    this._hubManager.connectToHub(foundHub.ip).then((hub) => {
                        hub.startActivity(activityId).then(() => {
                            resolve();
                        }).catch((err) => {
                            console.log(err);
                            reject(err);
                        });
                    }).catch((err) => {
                        reject(err);
                    });
                });
            })
    }

    hubAutoComplete(startActivityAction) {
        startActivityAction
            .getArgument('hub')
            .registerAutocompleteListener((query, args) => {
                const result = [];
                this._hubs.forEach((hub) => {
                    const autocompleteItem = {
                        name: hub.friendlyName,
                        hubId: hub.uuid
                    };
                    result.push(autocompleteItem);
                });

                return Promise.resolve(result);
            })
    }

    activityAutoComplete(startActivityAction) {
        startActivityAction
            .getArgument('activity')
            .registerAutocompleteListener((query, args) => {
                return new Promise((resolve, reject) => {
                    const result = [];
                    const hubArgValue = args.hub;
                    const foundHub = this.getHub(hubArgValue.hubId);

                    if (foundHub === undefined)
                        return reject();

                    if (hubArgValue !== '')
                        this._hubManager.connectToHub(foundHub.ip).then((hub) => {
                            hub.activities.forEach((activity) => {
                                const autocompleteItem = {
                                    name: activity.label,
                                    activityId: activity.id
                                };
                                result.push(autocompleteItem);
                            });
                            resolve(result);
                        });

                });
            });
    }

    registerSendCommandRunListener(sendCommandAction) {
        sendCommandAction
            .registerRunListener((args, state) => {
                console.log('Send Command!!');
                const hubDevice = args.hub_device;
                const hubDeviceData = hubDevice.getData();
                const hubId = hubDeviceData.hubId;
                const foundHub = this.getHub(hubId);
                const controlCommandArgValue = args.control_command;
                const repeat = args.control_command_repeat;

                return new Promise((resolve, reject) => {
                    if (foundHub === undefined)
                        return reject();

                    for (let index = 0; index - 1 < repeat; index++) {
                        this._hubManager.connectToHub(foundHub.ip).then((hub) => {
                            hub.commandAction(controlCommandArgValue.command).catch((err) => {
                                console.log(err);
                                reject(err);
                            });
                        });

                        if (index === repeat)
                            resolve(true);
                    }
                });
            })
    }

    commandAutocomplete(sendCommandAction) {
        sendCommandAction
            .getArgument('control_command')
            .registerAutocompleteListener((query, args) => {
                const hubDevice = args.hub_device;
                const hubDeviceData = hubDevice.getData();
                const controlGroupArgValue = args.control_group;
                const result = [];

                if (controlGroupArgValue !== '') {
                    const controlGroup = hubDeviceData.controlGroup.find(x => x.name === controlGroupArgValue.name);

                    if (controlGroup !== undefined)
                        controlGroup.function.forEach((command) => {
                            const autocompleteItem = {
                                name: command.label,
                                command
                            };
                            result.push(autocompleteItem);
                        });

                }
                return Promise.resolve(result);
            })
    }

    controlGroupAutoComplete(sendCommandAction) {
        sendCommandAction
            .getArgument('control_group')
            .registerAutocompleteListener((query, args) => {
                const hubDevice = args.hub_device;
                const hubDeviceData = hubDevice.getData();
                const result = [];

                hubDeviceData.controlGroup.forEach((group) => {
                    const autocompleteItem = {
                        name: group.name
                    };
                    result.push(autocompleteItem);
                });

                return Promise.resolve(result);
            })
    }

    getPairedDevices() {
        console.log('getPairedDevices...');
        const deviceDriver = this.homey.drivers.getDriver('harmony_device_driver');
        const devices = deviceDriver.getDevices();

        const cache = new Set();

        const devicesJson = JSON.stringify(devices, function(key, value) {
            if (typeof value === 'object' && value !== null) {
                if (cache.has(value))
                // Circular reference found
                    try {
                        // If this value does not reference a parent it can be deduped
                        return JSON.parse(JSON.stringify(value));
                    } catch (err) {
                        // discard key if value cannot be deduped
                        return;
                    }

                // Store value in our set
                cache.add(value);
            }
            return value;
        });

        return Promise.resolve(devicesJson);
    }

    sendDebugReport() {
        this.getPairedDevices().then((body) => {
            const url = new URL(Homey.env.DEBUG_REPORT_URL);
            url.method = 'POST';
            url.headers = {
                'Content-Type': 'application/json',
                'Content-Length': body.length
            };

            const request = https.request(url, (response) => {
            });

            request.on('error', (err) => {
                console.log(err);
            });

            request.write(body);
            request.end();

            return Promise.resolve();
        });
    }

}

module.exports = App;
