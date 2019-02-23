const EventEmitter = require('events');
const hub = require('./hub.js')

let hubs = {};
let instance = null;

class HubManager extends EventEmitter {
    constructor() {
        super();

        if (!instance)
            instance = this;

        return instance;
    }

    addHub(hubInfo) {
        return new Promise((resolve, reject) => {
            // TODO: refactor to use uuid instead of IP
            this.connectToHub(hubInfo.ip).then((existingHub) => {
                if (existingHub == undefined && hubInfo.friendlyName != undefined) {
                    let hubInstance = new hub(this, hubInfo);
                    hubs[hubInfo.ip] = hubInstance;
                    resolve(hubInstance);
                }
                resolve(existingHub);
            });
        })
    }

    connectToHub(host) {
        return new Promise((resolve, reject) => {
            let hubInstance = hubs[host];

            resolve(hubInstance);
        })
    }
}
module.exports = HubManager