'use strict';

const Homey = require('homey');
const HarmonyHubDiscover = require('harmonyhubjs-discover');
const harmony = require('harmonyhubjs-client');
const findHubsInterval = 60000;

class App extends Homey.App {

	onInit() {
		console.log(`${Homey.manifest.id} running...`);

		this._hubs = [];
		this._discover = new HarmonyHubDiscover(61991);
		this._discover.on('online', this.addHub.bind(this));
		this.findHubs();
		//setInterval( this.findHubs.bind(this), findHubsInterval );
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
						var foundDevice = {
							name: device.label,
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
		})
			.catch(function (e) {
				console.log(e)
			})
		return result;
	}

	sendCommand(hubId, command) {
		console.log(`Device hubId: ${hubId}`)
		var hub = this.getHub(hubId);
		var ip = hub.ip;
		var encodedAction = command.action.replace(/\:/g, '::');

		harmony(ip).then(function (harmonyClient) {
			return harmonyClient.send('holdAction', 'action=' + encodedAction + ':status=press');
		}).finally(function () {
			harmonyClient.end()
		});
	}
}

module.exports = App;