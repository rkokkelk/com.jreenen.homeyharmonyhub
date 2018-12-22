const EventEmitter = require('events');
class HubActivity extends EventEmitter {
    constructor(activity, parent){
        super();
        this.id = activity.id;
        this.label = activity.label;
        this.type = activity.type;
        this.fixit = activity.fixit;
        this.parent = parent;

        this.parent.on(`activityChangeMessage_${this.id}`, (message) =>
        { 
            this.handleActivityChanged(message)
        });
    }

    handleActivityChanged(activityMessage){
        console.log('Activity change notification received');
        
        if(this.id === '-1' && activityMessage.activityStatus === 0 && activityMessage.runningActivityList === ''){
            this.parent.emit('currentActivityChanged', this);
            this.parent.parent.emit('activityChanged', this.label, this.parent.uuid);
            for(var propertyName in this.fixit){
                let deviceState = this.fixit[propertyName];
                this.parent.emit(`deviceStateChanged_${deviceState.id}`, deviceState);
            }
        }

        if(activityMessage.activityId === activityMessage.runningActivityList && activityMessage.activityStatus === 2){
            this.parent.emit('currentActivityChanged', this);
            this.parent.parent.emit('activityChanged', this.label, this.parent.uuid);
            for(var propertyName in this.fixit){
                let deviceState = this.fixit[propertyName];
                this.parent.emit(`deviceStateChanged_${deviceState.id}`, deviceState);
            }
        }

        if(activityMessage.activityId !== activityMessage.runningActivityList && activityMessage.activityStatus === 2){
            this.parent.emit('currentActivityChanging', this);

            this.parent.parent.emit('activityChanging', this.label, this.parent.uuid);
        }
    }
}
module.exports = HubActivity