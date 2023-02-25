const WebSocket = require('ws');
const EventEmitter = require('events');
const Homey = require('homey');
const hubDevice = require('./hubdevice.js');
const hubActivity = require('./hubactivity.js');
const reconnectInterval = 5000;

class Hub extends EventEmitter {

    constructor(parent, oaObject) {
        super();

        this.current_fw_version = oaObject.current_fw_version;
        this.ip = oaObject.ip;
        this.hubProfiles = oaObject.hubProfiles;
        this.productId = oaObject.productId;
        this.uuid = oaObject.uuid;
        this.friendlyName = oaObject.friendlyName;
        this.remoteId = oaObject.remoteId;
        this.protocolVersion = oaObject.protocolVersion;
        this.hubId = oaObject.hubId;
        this.devices = [];
        this.activities = [];
        this.parent = parent;
        this.lastActivity = Date.now();
        this.lastPingTime = Date.now();
        this.msgId = 0;
        this.inActivityTimerID = 0;
        this.hubConnection = null;
        this.hubIsSyncing = false;

        this.websocket();
    }

    ping() {
        if (this.hubConnection.readyState === WebSocket.OPEN) {
            // console.log('SOCKET ping', this.ip);
            this.hubConnection.send('');
            this.lastPingTime = Date.now();
        } else
            console.log(`Ping socket ready state: ${this.hubConnection.readyState}`);

    }

    websocket() {
        this.hubConnection = new WebSocket('ws://' + this.ip + ':8088/?domain=svcs.myharmony.com&hubId=' + this.remoteId, { perMessageDeflate: false });

        this.hubConnection.on('close', () => {
            console.log('SOCKET closed', this.ip);

            this.removeAllListeners();
            this.parent.homey.setTimeout(this.websocket.bind(this), reconnectInterval);
            this.devices.forEach((device) => {
            	Homey.app.emit(`${device.id}_offline`, this);
            });

            this.activities.forEach((activity) => {
                Homey.app.emit(`${activity.id}_offline`, this);
            });
        });

        this.hubConnection.on('message', (data) => {
            this.handleMessage(data);
        });

        this.hubConnection.on('open', () => {
            console.log('SOCKET opened', this.ip);

            this.syncHub();
            this.parent.homey.clearInterval(this.inActivityTimerID);
            this.inActivityTimerID = this.parent.homey.setInterval(() => {
                const secondsPastSinceLastPing = ((Date.now() - this.lastPingTime) / 1000);
                if (secondsPastSinceLastPing >= 20) {
                    console.log(`Hub ${this.friendlyName} went offline, no ping response for ${secondsPastSinceLastPing} seconds.`);
                    if (this.hubConnection.readyState === WebSocket.OPEN)
                        this.hubConnection.close();

                }

                const minutesInactive = ((Date.now() - this.lastActivity) / 1000) / 60;
                this.parent.emit('inactivitytime', minutesInactive, this.uuid, this);
            }, 20000);
        });

        this.hubConnection.on('error', (data) => {
            console.log(`hub.js error: ${data}`);
            this.hubConnection.close();
        });

        this.on('currentActivityChanged', (activity, hubId) => {
            const foundHub = Homey.app.getHub(hubId);

            if (foundHub == undefined)
                return;

            if (hubId !== foundHub.uuid)
                return;

            if (this.currentActivity !== activity) {
                if (activity.id === '-1' && this.currentActivity.label !== undefined)
                    this.parent.emit('activityStopped', this.currentActivity.label, this.uuid);

                this.currentActivity = activity;
                this.lastActivity = Date.now();
            }
        });
    }

    syncHub() {
        console.log(`Syncing hub: ${this.friendlyName}........`);
        this.getDevices().then((devices) => {
            this.devices = [];

            devices.forEach((device) => {
                Homey.app.emit(`${device.id}_online`, this);
                this.devices.push(new hubDevice(device, this));
            });
        }).then(() => this.getActivities().then((activities) => {
            this.activities = [];

            activities.forEach((activity) => {
                Homey.app.emit(`${activity.id}_online`, this);
                this.activities.push(new hubActivity(activity, this));
            });
        }).then(() => this.getCurrentActivity().then((activityId) => {
            const activity = this.activities.find(x => x.id === activityId);
            console.log(`Current activity on ${this.friendlyName}: ${activity.label} (${activityId})`);

            this.currentActivity = activity;

            for (const propertyName in activity.fixit) {
                const deviceState = activity.fixit[propertyName];
                this.emit(`deviceStateChanged_${deviceState.id}`, deviceState);
            }
        }).then(() => this.getHubContent().then(content => {
            this.content = content;
        }))).then(() => {
            console.log(`Sync completed on ${this.friendlyName}`);
        }).catch((error) => {
            console.error(`Synchub error: ${error}`);
        }));
    }

    sendRequest(command, params, mssgId) {
        if (params == null)
            params = {
                verb: 'get',
                format: 'json'
            }

        const payload = {
            hubId: this.remoteId,
            timeout: 30,
            hbus: {
                cmd: command,
                id: this.msgId,
                params
            }
        }

        this.hubConnection.send(JSON.stringify(payload), (err) => {
            if (err)
                console.log(err);

        });
    }

    getCurrentActivity() {
        return new Promise((resolve, reject) => {
            this.msgId = this.msgId + 1;

            this.sendRequest('vnd.logitech.harmony/vnd.logitech.harmony.engine?getCurrentActivity', null, this.msgId);

            this.once(this.msgId, (err, result) => {
                if (err) {
                    console.log(err)
                    return reject(err)
                }

                resolve(result.data.result);
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

    getHubContent() {
        return new Promise((resolve, reject) => {
            this.getAvailableCommands().then((commands) => {
                resolve(commands.content);
            });
        });
    }

    getAvailableCommands() {
        return new Promise((resolve, reject) => {
            this.msgId = this.msgId + 1;
            this.sendRequest('vnd.logitech.harmony/vnd.logitech.harmony.engine?config', null, this.msgId);

            this.once(this.msgId, (err, result) => {
                if (err) {
                    console.log(err)
                    return reject(err)
                }

                resolve(result.data);
            });
        });
    }

    commandAction(command) {
        return new Promise((resolve, reject) => {
            const params = {
                status: 'press',
                timestamp: '0',
                verb: 'render',
                action: command.action
            }
            this.msgId = this.msgId + 1;
            this.sendRequest('vnd.logitech.harmony/vnd.logitech.harmony.engine?holdAction', params, this.msgId);

            this.once(this.msgId, (err, result) => {
                if (err) {
                    console.log(err)
                    return reject(err)
                }

                resolve(result.data);
            });

            this.lastActivity = Date.now();
        });
    }

    startActivity(activityId) {
        return new Promise((resolve, reject) => {
            const params = {
                async: 'true',
                timestamp: 0,
                args: {
                    rule: 'start'
                },
                activityId: String(activityId)
            }
            this.msgId = this.msgId + 1;
            this.sendRequest('harmony.activityengine?runactivity', params, this.msgId);

            this.once(this.msgId, (err, result) => {
                if (err) {
                    console.log(err)
                    return reject(err)
                }

                resolve();
            });
        });
    }

    stopActivity() {
        return new Promise((resolve, reject) => {
            this.startActivity(-1).then(() => {
                resolve();
            }).catch((err) => {
                console.log(err);
                reject(err);
            });
        });
    }

    handleMessage(message) {
        const messageObject = JSON.parse(message);
        let err = null;

        if (messageObject.hasOwnProperty('cmd')) {

            if (messageObject.code != 200) {
                err = 'Invalid status code';
                console.log(messageObject);
            }
            this.emit(messageObject.id, err, messageObject);
        }

        if (messageObject.hasOwnProperty('type'))
            if (messageObject.type === 'connect.stateDigest?notify') {
                if (messageObject.data.syncStatus === 1) {
                    this.hubIsSyncing = true;
                    return;
                }

                if (this.hubIsSyncing && messageObject.data.syncStatus === 0) {
                    this.hubIsSyncing = false;
                    this.syncHub();
                }

                this.emit(`activityChangeMessage_${messageObject.data.activityId}`, messageObject.data, this.uuid)
            }

    }

}
module.exports = Hub;
