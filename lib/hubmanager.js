const EventEmitter = require('events');
const Hub = require('./hub.js')

const hubs = {};
let instance = null;

class HubManager extends EventEmitter {

    constructor(homey) {
        super();
        this.homey = homey;

        // Singleton construct
        if (!instance) {
            instance = this;
            instance.setMaxListeners(0);
        }

        return instance;
    }

    addHub(hubInfo) {
        return new Promise((resolve, reject) => {
            // TODO: refactor to use uuid instead of IP
            this.connectToHub(hubInfo.ip).then((existingHub) => {
                if (existingHub === undefined && hubInfo.friendlyName !== undefined) {
                    const hubInstance = new Hub(this, hubInfo);
                    hubs[hubInfo.ip] = hubInstance;
                    resolve(hubInstance);
                }
                if (existingHub !== undefined)
                    existingHub.ping();

                resolve(existingHub);
            });
        })
    }

    connectToHub(host) {
        return new Promise((resolve, reject) => {
            const hubInstance = hubs[host];

            resolve(hubInstance);
        })
    }

}
module.exports = HubManager
