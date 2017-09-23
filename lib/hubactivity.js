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

    handleActivityChanged(result){
        console.log('RECEIVED A MESSAGE!!!');
        var activityMessage = JSON.parse(result.message.event[0]._);
        if(activityMessage.activityId === activityMessage.runningActivityList){
            this.parent.emit('currentActivityChanged', this);
            this.parent.parent.emit('activityChanged', this.label, this.parent.identity);
            for(var propertyName in this.fixit){
                let deviceState = this.fixit[propertyName];
                this.parent.emit(`deviceStateChanged_${deviceState.id}`, deviceState);
            }
        }
    }
}
module.exports = HubActivity