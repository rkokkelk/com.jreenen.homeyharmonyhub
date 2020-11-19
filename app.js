'use strict';
const inspector = require('inspector');
const Homey = require('homey');
const HubManager = require('./lib/hubmanager.js');
const Discovery = require('./lib/discovery.js');
const CapabilityHelper = require('./lib/capabilityhelper.js');
const https = require('https');
const parse = require('url').parse;

let events = require('events');
let eventEmitter = new events.EventEmitter();
let hubManager = new HubManager();
let capabilityhelper = new CapabilityHelper();

const iconsMap = {
	'AirConditioner': 'Air Conditioner.svg',
	'Amplifier': 'Amplifier.svg',
	'AppleTV': 'Apple TV.svg',
	'AudioVideoSwitch': 'Audio Video Switch.svg',
	'AutomationGateway': 'Automation gateway.svg',
	'Blinds': 'Blinds.svg',
	'MiniSystemCDRadioCassette': 'Boombox.svg',
	'MiniSystemDvdCDRadio': 'Boombox.svg',
	'MiniSystemDvdVcrRadio': 'Boombox.svg',
	'Camera': 'Camera.svg',
	'CDPlayer': 'CD Player.svg',
	'TVDVD': 'Clasic Television.svg',
	'TVDVDVCR': 'Clasic Television.svg',
	'TVHDD': 'Clasic Television.svg',
	'TVVCR': 'Clasic Television.svg',
	'ClimateControl': 'Climate Control.svg',
	'Computer': 'Computer.svg',
	'DAT': 'Digital Audio Cassette.svg',
	'Dimmer': 'Dimmer.svg',
	'DoorLock': 'Doorlock.svg',
	'DVDRVCR': 'DVD Player.svg',
	'DVDRecorder': 'DVD Player.svg',
	'DVDVCR': 'DVD Player.svg',
	'DVD': 'DVD.svg',
	'Fan': 'Fan.svg',
	'GameConsole': 'Game Console.svg',
	'GameConsoleWithDvd': 'Game Console.svg',
	'StereoReceiver': 'Hi-Fi Stereo.svg',
	'HomeAppliance': 'Home Appliances.svg',
	'Controller': 'Home Automation.svg',
	'CDJukebox': 'Jukebox.svg',
	'Laptop': 'Laptop.svg',
	'LaserdiscPlayer': 'Laser Disc.svg',
	'LightController': 'Light controller.svg',
	'MediaPlayer': 'Media Player.svg',
	'MinidiscPlayer': 'Mini disk.svg',
	'Monitor': 'Monitor.svg',
	'DigitalMusicServer': 'Music server.svg',
	'Plug': 'Plug.svg',
	'ProjectorScreen': 'Projector Screen.svg',
	'Projector': 'Projector.svg',
	'RadioTuner': 'Radio.svg',
	'PVR': 'PVR.svg',
	'Satellite': 'Satelite Dish.svg',
	'Sensor': 'Sensor.svg',
	'CableBox': 'Set-top box.svg',
	'DigitalSetTopBox': 'Set-top box.svg',
	'SmokeDetector': 'Smoke Detector.svg',
	'Television': 'Television.svg',
	'Thermostat': 'Thermostat.svg',
	'Nest': 'Thermostat.svg',
	'VCR': 'VCR.svg',
	'TVCamera': 'Video Camera.svg',
}

class App extends Homey.App {

	onInit() {
		console.log(`${Homey.manifest.id} running...`);

		if (Homey.env.ENVIRONMENT_NAME === "LOCAL") {
			inspector.open(9229, '0.0.0.0', true)
		}

		this._hubs = [];
		this._activities = [];
		this._discover = new Discovery();

		this.wireEvents();
		this.registerActions();
	}

	wireEvents() {
		this._discover.on('hubconnected', hub => {
			var found = this._hubs.some((existingHub) => {
				return existingHub.uuid === hub.uuid;
			});

			if (found === false && hub.ip !== undefined && hub.friendlyName != undefined) {
				hub.Hub = hubManager.connectToHub(hub.ip);
				this.addHub(hub);
			}

			if (hub.friendlyName != undefined) {
				this.emit('hubonline', hub, true);
			}

		});

		hubManager.on('activityChanged', (activityName, hubId) => {
			console.log(activityName);
			console.log(hubId);
			let foundHub = this.getHub(hubId);

			if (foundHub == undefined) {
				return;
			}

			let tokens = {
				'hub': foundHub.friendlyName,
				'activity': activityName
			}

			let activityStartedTrigger = new Homey.FlowCardTrigger('activity_started')
				.register();

			activityStartedTrigger.trigger(tokens)
		});

		hubManager.on('inactivitytime', (seconds, hubId, hubInstance) => {
			let state = { 'inactivefor': seconds }
			let foundHub = this.getHub(hubId);

			if (foundHub == undefined)
				return;

			let tokens = {
				'hub': foundHub.friendlyName
			}

			let inactiveTrigger = new Homey.FlowCardTrigger('hub_inactive')
				.registerRunListener((args, state) => {
					if (state.inactivefor >= args.inactivefor) {
						hubInstance.lastActivity = Date.now();
					}
					return Promise.resolve(state.inactivefor >= args.inactivefor);
				})
				.register();
			inactiveTrigger.trigger(tokens, state);
		})

		hubManager.on('activityChanging', (activityName, hubId) => {
			console.log(activityName);
			console.log(hubId);
			let foundHub = this.getHub(hubId);

			if (foundHub == undefined)
				return;

			let tokens = {
				'hub': foundHub.friendlyName,
				'activity': activityName
			}

			let activityStartingTrigger = new Homey.FlowCardTrigger('activity_starting')
				.register();
			activityStartingTrigger.trigger(tokens)

		});

		hubManager.on('activityStopped', (activityName, hubId) => {
			let foundHub = this.getHub(hubId);

			if (foundHub == undefined) {
				return;
			}

			let tokens = {
				'hub': foundHub.friendlyName,
				'activity': activityName
			}

			let activityStoppedTrigger = new Homey.FlowCardTrigger('activity_stopped')
				.register();

			activityStoppedTrigger.trigger(tokens)
		});
	}

	findHubs() {
		console.log("Finding hubs....")
		this._discover.start();
	}

	addHub(hub) {
		var hasFriendlyName = hub.friendlyName != undefined;

		if (hasFriendlyName) {
			hub.icon = `/app/${Homey.manifest.id}/assets/icon.svg`;
			this._hubs.push(hub);
			console.log(`discovered ${hub.ip} ${hub.friendlyName} ${hub.uuid}`);

			eventEmitter.emit('hubAdded', hub);
		}
	}

	getHub(hubId) {
		var foundHub = this._hubs.find(x => x.uuid === hubId);

		if (foundHub === undefined) {
			console.log(`No hub found with id ${hubId}`)
		}

		return foundHub;
	}

	getHubs() {
		return this._hubs;
	}

	getHubActivities(ip, hubId) {
		var activities = [];

		return new Promise((resolve, reject) => {
			hubManager.connectToHub(ip).then((hub) => {
				hub.activities.forEach((activity) => {
					if (activity.controlGroup !== undefined) {
						capabilityhelper.getCapabilities(activity.controlGroup).then((capabilities) => {
							capabilities.push('onoff');
							if (activity.type === 'VirtualTelevisionN') {
								var foundDevice = {
									name: activity.label,
									class: 'tv',
									capabilities: capabilities,
									data: {
										id: activity.id,
										hubId: hubId,
										controlGroup: activity.controlGroup,
										label: activity.label
									}
								};

								activities.push(foundDevice);
							}
							else {
								var foundDevice = {
									name: activity.label,
									capabilities: capabilities,
									data: {
										id: activity.id,
										hubId: hubId,
										controlGroup: activity.controlGroup,
										label: activity.label
									}
								};

								activities.push(foundDevice);
							}
						});
					}
				});
				resolve(activities);
			});
		});
	}

	getHubDevices(ip, hubId) {
		var devices = [];

		return new Promise((resolve, reject) => {
			hubManager.connectToHub(ip).then((hub) => {
				hub.devices.forEach((device) => {
					capabilityhelper.getCapabilities(device.controlGroup).then((capabilities) => {
						console.log(device.type);
						let iconName = iconsMap[device.type];
						let iconPath = '';
						if (iconName !== undefined) {
							iconPath = `/device_icons/${iconName}`;
						}
						else {
							iconPath = `/icon.svg`;
						}

						var foundDevice = {
							name: device.label,
							icon: iconPath,
							capabilities: capabilities,
							data: {
								id: device.id,
								hubId: hubId,
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
		let sendCommandAction = new Homey.FlowCardAction('send_command')
			.register();

		this.controlGroupAutoComplete(sendCommandAction);
		this.commandAutocomplete(sendCommandAction);
		this.registerSendCommandRunListener(sendCommandAction);

		let startActivityAction = new Homey.FlowCardAction('start_activity')
			.register();
		this.hubAutoComplete(startActivityAction);
		this.activityAutoComplete(startActivityAction);
		this.registerStartActivityCommandRunListener(startActivityAction);

		let stopActivityAction = new Homey.FlowCardAction('stop_activity')
			.register();
		this.hubAutoComplete(stopActivityAction);
		this.registerStopActivityCommandRunListener(stopActivityAction);

		let isActivityCondition = new Homey.FlowCardCondition('is_activity')
			.register()
			.registerRunListener((args, state) => {
				console.log(args.activity_input);
				console.log(args.activity.name)
				let isActivity = args.activity_input.trim() === args.activity.name.trim();
				console.log(isActivity);
				return Promise.resolve(isActivity);
			});
		this.hubAutoComplete(isActivityCondition);
		this.activityAutoComplete(isActivityCondition);

	}

	registerStopActivityCommandRunListener(stopActivityAction) {
		stopActivityAction
			.registerRunListener((args, state) => {
				console.log('Stop activity!!');
				let hubArgValue = args.hub;
				let hubId = hubArgValue.hubId;
				let foundHub = this.getHub(hubId);

				return new Promise((resolve, reject) => {
					if (foundHub == undefined) {
						return reject();
					}

					hubManager.connectToHub(foundHub.ip).then((hub) => {
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
				let hubArgValue = args.hub;
				let hubId = hubArgValue.hubId;
				let activityId = args.activity.activityId;
				let foundHub = this.getHub(hubId);

				return new Promise((resolve, reject) => {
					if (foundHub == undefined) {
						return reject();
					}

					hubManager.connectToHub(foundHub.ip).then((hub) => {
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
				let result = [];
				this._hubs.forEach((hub) => {
					let autocompleteItem =
					{
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
					let result = [];
					let hubArgValue = args.hub;
					let foundHub = this.getHub(hubArgValue.hubId);

					if (foundHub == undefined) {
						return reject();
					}

					if (hubArgValue !== '') {
						hubManager.connectToHub(foundHub.ip).then((hub) => {
							hub.activities.forEach((activity) => {
								let autocompleteItem =
								{
									name: activity.label,
									activityId: activity.id
								};
								result.push(autocompleteItem);
							});
							resolve(result);
						});
					}
				});
			});
	}


	registerSendCommandRunListener(sendCommandAction) {
		sendCommandAction
			.registerRunListener((args, state) => {
				console.log('Send Command!!');
				let hub_device = args.hub_device;
				let hub_device_data = hub_device.getData();
				let hubId = hub_device_data.hubId;
				let foundHub = this.getHub(hubId);
				let controlCommandArgValue = args.control_command;
				let repeat = args.control_command_repeat;

				return new Promise((resolve, reject) => {
					if (foundHub == undefined) {
						return reject();
					}

					for (var index = 0; index - 1 < repeat; index++) {
						hubManager.connectToHub(foundHub.ip).then((hub) => {
							hub.commandAction(controlCommandArgValue.command).catch((err) => {
								console.log(err);
								reject(err);
							});
						});

						if (index == repeat)
							resolve(true);
					}
				});
			})
	}

	commandAutocomplete(sendCommandAction) {
		sendCommandAction
			.getArgument('control_command')
			.registerAutocompleteListener((query, args) => {
				let hub_device = args.hub_device;
				let hub_device_data = hub_device.getData();
				let controlGroupArgValue = args.control_group;
				let result = [];

				if (controlGroupArgValue !== '') {
					let controlGroup = hub_device_data.controlGroup.find(x => x.name == controlGroupArgValue.name);

					if (controlGroup !== undefined) {
						controlGroup.function.forEach((command) => {
							let autocompleteItem =
							{
								name: command.label,
								command: command,
							};
							result.push(autocompleteItem);
						});
					}
				}
				return Promise.resolve(result);
			})
	}

	controlGroupAutoComplete(sendCommandAction) {
		sendCommandAction
			.getArgument('control_group')
			.registerAutocompleteListener((query, args) => {
				let hub_device = args.hub_device;
				let hub_device_data = hub_device.getData();
				let result = [];

				hub_device_data.controlGroup.forEach((group) => {
					let autocompleteItem =
					{
						name: group.name,
					};
					result.push(autocompleteItem);
				});

				return Promise.resolve(result);
			})
	}

	getPairedDevices() {
		let deviceDriver = Homey.ManagerDrivers.getDriver('harmony_device_driver');
		let devices = deviceDriver.getDevices();

		let cache = new Set();

		let devicesJson = JSON.stringify(devices, function (key, value) {
			if (typeof value === 'object' && value !== null) {
				if (cache.has(value)) {
					// Circular reference found
					try {
						// If this value does not reference a parent it can be deduped
						return JSON.parse(JSON.stringify(value));
					}
					catch (err) {
						// discard key if value cannot be deduped
						return;
					}
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
			let url = parse(Homey.env.DEBUG_REPORT_URL);
			url.method = 'POST';
			url.headers = {
				'Content-Type': 'application/json',
				'Content-Length': body.length
			};

			let request = https.request(url, (response) => {
			});

			request.on('error', (err) => {
				console.log(err);
			});

			request.write(body);
			request.end;

			return Promise.resolve();
		});
	}
}

module.exports = App;
