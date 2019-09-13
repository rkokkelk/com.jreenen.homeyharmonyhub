const EventEmitter = require('events');

class HubActivity extends EventEmitter {
    constructor (activity, parent) {
        super();

        this.id = activity.id;
        this.label = activity.label;
        this.type = activity.type;
        this.fixit = activity.fixit;
        this.controlGroup = activity.controlGroup;
        this.parent = parent;
        this.parent.on(`activityChangeMessage_${this.id}`, this.handleActivityChanged.bind(this));
    }

    handleActivityChanged (activityMessage, hubId){
        console.log(`Activity change notification received on hub ${hubId}`);
        if(hubId != this.parent.uuid){
            return;
        }

        if(this.id === '-1' && activityMessage.activityStatus === 0 && activityMessage.runningActivityList === ''){
            this.parent.emit('currentActivityChanged', this, this.parent.uuid);
            this.parent.parent.emit('activityChanged', this.label, this.parent.uuid);
            for(var propertyName in this.fixit){
                let deviceState = this.fixit[propertyName];
                this.parent.emit(`deviceStateChanged_${deviceState.id}`, deviceState);
            }
        }

        if(activityMessage.activityId === activityMessage.runningActivityList && activityMessage.activityStatus === 2){
            this.parent.emit('currentActivityChanged', this, this.parent.uuid);
            this.parent.parent.emit('activityChanged', this.label, this.parent.uuid);
            for(var propertyName in this.fixit){
                let deviceState = this.fixit[propertyName];
                this.parent.emit(`deviceStateChanged_${deviceState.id}`, deviceState);
            }
        }

        if(activityMessage.activityId !== activityMessage.runningActivityList && activityMessage.activityStatus === 1){
            this.parent.parent.emit('activityChanging', this.label, this.parent.uuid);
        }
    }
}

module.exports = HubActivity
