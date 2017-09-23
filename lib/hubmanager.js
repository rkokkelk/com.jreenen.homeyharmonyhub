const Client = require('node-xmpp-client');
const parseString = require('xml2js').parseString;
const hub = require('./hub.js')
const uuidv4 = require('uuid/v4');
const hubIQ = require('./hubiq.js');
const EventEmitter = require('events');

let instance = null;
let hubs = {};

class HubManager extends EventEmitter {
    constructor() {
        super();
        if (!instance) {
            instance = this;
        }

        return instance;
    }

    connectToHub(host, port) {
        return new Promise((resolve, reject) => {
            let hubInstance = hubs[host];
            if (hubInstance == undefined) {
                this._connectToHubAsGuest(host, port).then((xmppClient) => {
                    this._pairHub(xmppClient).then((oaObject) => {
                        this._connectToHubAsAuthenticatedUser(oaObject, host, port).then((client) => {
                            let hubInstance = new hub(client, this, oaObject);
                            hubs[host] = hubInstance;

                            resolve(hubInstance);
                        })
                    })
                });
            }
            else{
                resolve(hubInstance);
            }
        })
    }

    _connectToHubAsGuest(host, port) {
        let xmppClient = new Client({
            jid: 'guest@x.com/gatorade',
            password: 'guest',
            host: host,
            port: port,
            disallowTLS: true
        });

        return new Promise((resolve, reject) => {
            xmppClient.on('online', () => {
                console.log('XMPP client connected')
                resolve(xmppClient);
            })
        })
    }

    _pairHub(xmppClient) {
        let id = uuidv4();
        let xmlns = 'connect.logitech.com'; 
        let type = 'get'
        let mime = 'vnd.logitech.connect/vnd.logitech.pair';
        let from = 'get';
        let action = 'method=pair:name=harmonyjs#iOS6.0.1#iPhone'
        let hubiq = new hubIQ(id, xmlns, type, mime, from, action);
        
        hubiq.getIQ().then((iq) => {
            console.log(iq)
            xmppClient.send(iq);
        });

        return new Promise((resolve, reject) => {
            xmppClient.on('stanza', function (stanza) {
                console.log(`received XMPP stanza ${stanza}`)
                parseString(stanza, (err, result) => {
                    if (stanza.is('iq')) {
                        console.log(`IQ message received`);
                        let oa = result.iq.oa;
                        if (oa !== undefined) {
                            let oaResult = oa[0]._.split(":");
                            let oaObject = {};
                            oaResult.forEach((element) => {
                                let key = element.split('=')[0];
                                let value = element.split('=').slice(1).join('=');
                                oaObject[key] = value;
                            });

                            console.log(oaObject);
                            xmppClient.end();
                            resolve(oaObject);
                        }
                    }
                })
            })
        })
    }

    _connectToHubAsAuthenticatedUser(oaObject, host, port) {
        let jid = `${oaObject.identity}@connect.logitech.com/gatorade`;
        let client = new Client({
            jid: jid,
            password: oaObject.identity,
            host: host,
            port: port,
            reconnect: true,
            disallowTLS: true
        })

        client.connection.socket.setTimeout(0);
        client.connection.socket.setKeepAlive(true, 1000);

        return new Promise((resolve, reject) => {
            resolve(client)
        })
    }
}
module.exports = HubManager