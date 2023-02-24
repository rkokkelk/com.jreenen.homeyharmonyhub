const Homey = require('homey');
module.exports = [
    {
        description: 'Get a list of all paired devices',
        method: 'GET',
        path: '/getPairedDevices/',
        fn: function(callback, args) {
            return Promise.resolve(Homey.app.getPairedDevices());
        }
    },
    {
        description: 'Sends a debug report',
        method: 'POST',
        path: '/sendDebugReport/',
        fn: function(callback, args) {
            return Promise.resolve(Homey.app.sendDebugReport());
        }
    }

];
