module.exports = {
    // description: 'Get a list of all paired devices'
    async getPairedDevices({ homey, query }) {
	  const result = await this.homey.app.getPairedDevices();
        return (result);
    },
    // description: 'Sends a debug report'
    async sendDebugReport({ homey, params, body }) {
        return homey.app.sendDebugReport(params, body); ;
    }
};
