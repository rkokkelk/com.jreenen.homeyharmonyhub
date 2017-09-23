const uuidv4 = require('uuid/v4');
const hubIQ = require('./hubiq.js');
const hubDevice = require('./hubdevice.js');
const hubActivity = require('./hubactivity.js');
const parseString = require('xml2js').parseString;
const EventEmitter = require('events');

class Hub extends EventEmitter {

    constructor(client,parent, oaObject) {
        super();

        client.parent = this;
        this.client = client;
        this.serverIdentity = oaObject.serverIdentity;
        this.hubId = oaObject.hubId;
        this.identity = oaObject.identity;
        this.status = oaObject.status;
        this.protocolVersion = oaObject.protocolVersion;
        this.hubProfiles = oaObject.hubProfiles;
        this.productId = oaObject.productId;
        this.friendlyName = oaObject.friendlyName;
        this.devices = [];
        this.activities = [];
        this.parent = parent;

        this.on('currentActivityChanged', (activity) => {
            if(this.currentActivity !== activity){
                this.parent.emit('activityStopped', this.currentActivity.label, this.identity);
                this.currentActivity = activity;
            }
        })

        client.on("stanza", this._stanzaReceived);
        client.on('online', this._clienOnline);
        client.on('error', this._clientError);
        client.once('online', () => {
            this.getDevices().then((devices) => {
                devices.forEach((device) => {
                    this.devices.push(new hubDevice(device, this));
                });
            }).then(() => this.getActivities().then((activities) => {
                activities.forEach((activity) => {
                    this.activities.push(new hubActivity(activity, this));
                });
            }).then(() => this.getCurrentActivity().then((activityId) => {
                console.log(activityId);
                let activity = this.activities.find(x => x.id === activityId);

                this.currentActivity = activity;

                for(var propertyName in activity.fixit){
                    let deviceState = activity.fixit[propertyName];
                    this.emit(`deviceStateChanged_${deviceState.id}`, deviceState);
                }
            })));
        })
    }

    getCurrentActivity() {
        return new Promise((resolve, reject) => {
            let id = uuidv4();
            let xmlns = 'connect.logitech.com';
            let type = 'get';
            let mime = 'vnd.logitech.harmony/vnd.logitech.harmony.engine?getCurrentActivity';
            let from = id;
            let action = '';
            let hubiq = new hubIQ(id, xmlns, type, mime, from, action);

            hubiq.getIQ().then((iq) => {
                this.client.send(iq);
            });

            this.once(id, (stanza) => {
                parseString(stanza, (err, result) => {
                    let responseCode = result.iq.oa[0].$.errorcode;
                    if (responseCode !== '200') {
                        reject('Could not obtain the current activity.');
                    }

                    let stanzaResult = result.iq.oa[0]._.split('=')[1];
                    resolve(stanzaResult);
                });
            });
        })
    }

    getActivities() {
        return new Promise((resolve, reject) => {
            this.getAvailableCommands().then((commands) => {
                resolve(commands.activity);
            });
        });
    }

    getDevices() {
        return new Promise((resolve, reject) => {
            this.getAvailableCommands().then((commands) => {
                resolve(commands.device);
            });
        });
    }

    getAvailableCommands() {
        return new Promise((resolve, reject) => {
            let id = uuidv4();
            let xmlns = 'connect.logitech.com';
            let type = 'get';
            let mime = 'vnd.logitech.harmony/vnd.logitech.harmony.engine?config';
            let from = id;
            let action = '';
            let hubiq = new hubIQ(id, xmlns, type, mime, from, action);

            hubiq.getIQ().then((iq) => {
                this.client.send(iq);
            });

            this.once(id, (stanza) => {
                parseString(stanza, (err, result) => {
                    let responseCode = result.iq.oa[0].$.errorcode;
                    if (responseCode !== '200') {
                        reject('Could not obtain the available commands.');
                    }
                });

                var response = stanza.getChildText('oa');
                let decoded = JSON.parse(response);
                resolve(decoded);
            });

        });
    }

    commandAction(command) {
        return new Promise((resolve, reject) => {
            var encodedAction = command.action.replace(/\:/g, '::');

            let id = uuidv4();
            let xmlns = 'connect.logitech.com';
            let type = 'get';
            let mime = 'vnd.logitech.harmony/vnd.logitech.harmony.engine?holdAction';
            let from = id;
            let action = `action=${encodedAction}:status=press`;
            let hubiq = new hubIQ(id, xmlns, type, mime, from, action);

            hubiq.getIQ().then((iq) => {
                this.client.send(iq);
            });

            this.once('commandSend', ((stanza) => {
                resolve();
            }));
            
        });
    }

    startActivity(activityId){
        return new Promise((resolve, reject) => {
            let id = uuidv4();
            let xmlns = 'connect.logitech.com';
            let type = 'get';
            let mime = 'vnd.logitech.harmony/vnd.logitech.harmony.engine?startactivity';
            let from = id;
            let action = `activityId=${activityId}:timestamp=${new Date().getTime()}`;
            let hubiq = new hubIQ(id, xmlns, type, mime, from, action);
        
            hubiq.getIQ().then((iq) => {
                this.client.send(iq);
            });

            this.once(id, (stanza) => {
                resolve();
            });

        });
    }

    stopActivity(){
        return new Promise((resolve, reject) => {
            this.startActivity(-1).then(() => {
                resolve();
            })
        });
    }

    _stanzaReceived(stanza) {
        //console.log(`Stanza received ${stanza}`);
        parseString(stanza, (err, result) => {
            if (stanza.is('iq')) {
                let to = result.iq.$.to;
                if (to === undefined) {
                    this.parent.emit('commandSend', stanza);
                }

                if (to !== undefined) {
                    console.log(`IQ to ${to}`);
                    this.parent.emit(to, stanza);
                }
            }
            if (stanza.is('message')) {
                let to = result.message.$.to;
                if (to !== undefined) {
                    if(result.message.event[0].$.type === 'connect.stateDigest?notify'){
                        var activityMessage = JSON.parse(result.message.event[0]._);
                        this.parent.emit(`activityChangeMessage_${activityMessage.activityId}`, result)
                    }

                    this.parent.emit(to, stanza);
                }
            }
        });
    }

    _clienOnline() {
        console.log('AUTHORIZED CLIENT CONNECTED');
    }

    _clientError(err) {
        console.log(`Error received ${err}`);
    }
}
module.exports = Hub;