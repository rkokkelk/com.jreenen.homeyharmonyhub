const Homey = require('homey');
module.exports = [
    {
        description: 'Get a list of all paired devices',
        method: 'GET',
        path: '/getPairedDevices/',
        // requires_authorizaton: false,
        fn: function (callback, args) {
            return Promise.resolve(Homey.app.getPairedDevices());
        }
    }
];