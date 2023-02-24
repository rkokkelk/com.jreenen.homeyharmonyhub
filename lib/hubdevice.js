const EventEmitter = require('events');

class HubDevice extends EventEmitter {

    constructor(device, parent) {
        super();

        this.id = device.id;
        this.label = device.label;
        this.type = device.type;
        this.controlGroup = device.controlGroup;
        this.model = device.model;
        this.manufacturer = device.manufacturer;
        this.parent = parent;
        this.power = '';
        this.parent.on(`deviceStateChanged_${this.id}`, this.handleDeviceStateChanged.bind(this));

        parent.parent.emit(`deviceInitialized_${this.id}`, this);
    }

    handleDeviceStateChanged(deviceState) {
        this.power = deviceState.Power;
        this.emit('stateChanged', deviceState);
    }

}

module.exports = HubDevice
