'use strict';

const Homey = require('homey');

class HarmonyActivityDriver extends Homey.Driver {

    async onInit() {
        console.log('Harmony activity driver initializing...');
    }

    async onPair(session) {
        const state = {
            connected: true,
            hub: undefined
        };

        session.setHandler('select_hub', async (data) => {
            const result = [];

            const hubs = this.homey.app.getHubs();
            hubs.forEach(function(hub) {
                result.push({
                    id: hub.uuid,
                    name: hub.friendlyName,
                    icon: hub.icon
                })
            }, this);

            return (result);
        });

        session.setHandler('hub_changed', async (data) => {
            state.hub = this.homey.app.getHub(data.logitech_hubId);
        });

        session.setHandler('list_devices', async (data) => {
            console.log('ActivityDriver: List devices started...');
            return this.homey.app.getHubActivities(state.hub.ip, state.hub.uuid).then((devices) => {
                return (devices);
            });
        })

    }

}

module.exports = HarmonyActivityDriver;
