const WebSocket = require('ws');
const EventEmitter = require('events');

const hubDevice = require('./hubdevice.js');
const hubActivity = require('./hubactivity.js');

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
        this.msgId = 0;

        this.on('currentActivityChanged', (activity) => {
            if(this.currentActivity !== activity){
                if(activity.id  === '-1')
                    this.parent.emit('activityStopped', this.currentActivity.label, this.uuid);

                this.currentActivity = activity;
                this.lastActivity = Date.now();
            }
        })

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

            for (var propertyName in activity.fixit){
                let deviceState = activity.fixit[propertyName];
                this.emit(`deviceStateChanged_${deviceState.id}`, deviceState);
            }
        })));

        setInterval(() => {
            let secondsInactive = ((Date.now() - this.lastActivity) / 1000) / 60;
            this.parent.emit('inactivitytime', secondsInactive, this.uuid, this);
        }, 10000);
    }

    sendRequest(command, params, response) {
        let ws = new WebSocket('ws://' + this.ip + ':8088/?domain=svcs.myharmony.com&hubId=' + this.remoteId);

        if (params == null) {
            params = {
                "verb"  : "get",
                "format": "json"
            }
        }

        ws.on('open', () => {
            this.msgId = this.msgId + 1;

            let payload = {
                "hubId"  : this.remoteId,
                "timeout": 30,
                "hbus"   : {
                    "cmd": command,
                    "id" : this.msgId,
                    "params": params
                }
            }

            ws.send(JSON.stringify(payload), (err) => {
                if (err) {
                    console.log(err);
                    ws.close();
                }

                if (!response)
                    ws.close();
            });
        });

        ws.on('message', (data) => {
            let err = null;
            let result = JSON.parse(data);

            if (result.code != 200)
                err = 'Invalid status code';
            if (result.id != this.msgId)
                err = 'Invalid msgId';

            ws.close();
            this.emit('receivedData', err, result);
        });

        ws.on('error', (err) => {
            this.emit('receivedData', 'websocket error', null);
            ws.close();
        });

        ws.on('close', () => {});
    }

    getCurrentActivity() {
        return new Promise((resolve, reject) => {
            this.sendRequest('vnd.logitech.harmony/vnd.logitech.harmony.engine?getCurrentActivity', null, true);

            this.once('receivedData', (err, result) => {
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

    getAvailableCommands() {
        return new Promise((resolve, reject) => {
            this.sendRequest('vnd.logitech.harmony/vnd.logitech.harmony.engine?config', null, true);

            this.once('receivedData', (err, result) => {
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
            let params = {
                'status': 'press',
                'timestamp': '0',
                'verb': 'render',
                'action': command.action
            }

            this.sendRequest('vnd.logitech.harmony/vnd.logitech.harmony.engine?holdAction', params, true);

            this.once('receivedData', (err, result) => {
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
            let params = {
                'async': 'true',
                'timestamp': 0,
                'args': {
                    'rule': 'start'
                },
                'activityId': String(activityId)
            }

            this.sendRequest('harmony.activityengine?runactivity', params, true);

            this.once('receivedData', (err, result) => {
                if (err) {
                    console.log(err)
                    return reject()
                }

                resolve();
            });
        });
    }

    stopActivity(){
        return new Promise((resolve, reject) => {
            this.startActivity(-1).then(() => {
                resolve();
            }).catch(() => {
                reject();
            });
        });
    }
}
module.exports = Hub;