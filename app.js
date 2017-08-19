'use strict';

const Homey = require('homey');

const HarmonyHubDiscover = require('harmonyhubjs-discover');
const harmony = require('harmonyhubjs-client');
let appInsights = require("applicationinsights");
let appInsightsClient;

const iconsMap = {
	'PVR': 'pvr_noun_893953_FFFFFF',
	'StereoReceiver': 'stereo_receiver_noun_586620_FFFFFF',
	'Television': 'television_noun_541411_FFFFFF',
	'GameConsoleWithDvd': 'gameconsole_noun_444_FFFFFF'
}

class App extends Homey.App {

	onInit() {
		console.log(`${Homey.manifest.id} running...`);
		process.env.APPINSIGHTS_INSTRUMENTATIONKEY = "4f45f195-c5f9-4b27-acb9-f30b04e399fe";
		appInsights.setup()
			.setAutoDependencyCorrelation(true)
			.setAutoCollectRequests(true)
			.setAutoCollectPerformance(true)
			.setAutoCollectExceptions(true)
			.setAutoCollectDependencies(true)
			.setAutoCollectConsole(true)
			.start();
		appInsightsClient = appInsights.getClient();

		this._hubs = [];
		this._discover = new HarmonyHubDiscover(61991);
		this._discover.on('online', this.addHub.bind(this));
		this.findHubs();
		this.registerActions();
	}

	findHubs() {
		console.log("Finding hubs....")
		this._discover.start();
	}

	addHub(hub) {
		var hasFriendlyName = hub.friendlyName != undefined;
		var found = this._hubs.some(function (existingHub) {
			return existingHub.uuid === hub.uuid;
		});

		if (hasFriendlyName && !found) {
			hub.icon = `/app/${Homey.manifest.id}/assets/icon.svg`;
			this._hubs.push(hub);
			console.log(`discovered ${hub.ip} ${hub.friendlyName}`)
		}
	}

	getHub(hubId) {
		var foundHub = this._hubs.find(x => x.uuid === hubId);
		console.log(`Found hub with id ${foundHub.uuid} and name ${foundHub.friendlyName}`)
		return foundHub;
	}

	getHubs() {
		return this._hubs;
	}

	getHubDevices(ip, hubId) {
		var devices = [];

		var result = harmony(ip).then(function (harmonyClient) {
			return harmonyClient.getAvailableCommands()
				.then(function (commands) {
					commands.device.forEach(function (device) {
						let iconName = iconsMap[device.type];
						let iconPath = '';
						if (iconName !== undefined) {
							iconPath = `/images/${iconName}.svg`;
						}
						else {
							iconPath = `/icon.svg`;
							appInsightsClient.trackEvent('unknown device type', { deviceType: device.type })
						}
						var foundDevice = {
							name: device.label,
							icon: iconPath,
							data: {
								id: device.id,
								hubId: hubId,
								controlGroup: device.controlGroup,
								device: device,
							}
						};
						devices.push(foundDevice);

					}, this)
					return devices;
				})
				.finally(function () {
					harmonyClient.end()
				})
		}).catch(function (e) {
			console.log(e)
		})
		return result;
	}

	sendCommand(hubId, command) {
		console.log(`Device hubId: ${hubId}`)
		var hub = this.getHub(hubId);
		var ip = hub.ip;
		var encodedAction = command.action.replace(/\:/g, '::');

		harmony(ip).then((harmonyClient) => {
			return harmonyClient.send('holdAction', 'action=' + encodedAction + ':status=press')
			.finally(() => {
				harmonyClient.end()
				console.log('Client disconnected');
			})
		});
	}

	registerActions() {
		let sendCommandAction = new Homey.FlowCardAction('send_command')
			.register();
		this.controlGroupAutoComplete(sendCommandAction);
		this.commandAutocomplete(sendCommandAction);
		this.registerRunListener(sendCommandAction);
	}

	registerRunListener(sendCommandAction) {
		sendCommandAction
			.registerRunListener((args, state) => {
				console.log('Send Command!!');
				let hub_device = args.hub_device;
				let hub_device_data = hub_device.getData();
				let hubId = hub_device_data.hubId;
				let controlCommandArgValue = args.control_command;
				this.sendCommand(hubId, controlCommandArgValue.command);
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
					controlGroup.function.forEach((command) => {
						let autocompleteItem =
							{
								name: command.label,
								command: command,
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

		process.on('uncaughtException', (err) => {
			console.log('whoops! there was an error');
			appInsightsClient.trackException(new Error(JSON.stringify(err)));
			
		});
	}
}

module.exports = App;