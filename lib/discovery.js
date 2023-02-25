'use strict';
const EventEmitter = require('events');
const dgram = require('dgram');
const os = require('os');
const net = require('net');

class Discovery extends EventEmitter {

    constructor(hubManager, homey) {
        super();
        this.homey = homey;
        this._hubManager = hubManager;
        this.LISTENER_PORT = 5446;
        this.MULTICAST_ADDR = '255.255.255.255';
        this.MULTICAST_PORT = 5224;
        this.PING_INTERVAL = 2000;

        this.Listener = this._getListener();
        this._getBroadcastSocket();
    }

    _getBroadcastSocket() {
        const socket = dgram.createSocket('udp4');

        socket.on('error', (err) => {
            console.log(`discovery.js: Socket error ${err}`);
            socket.close();
        });

        socket.on('listening', () => {
            socket.setBroadcast(true);

            this.homey.setInterval(() => {
                const data = '_logitech-reverse-bonjour._tcp.local.\r\n' +
                    this.LISTENER_PORT + '\r\n' +
                    this._getLocalIp() + '\r\n' +
                    'string';

                const search = Buffer.from(data, 'ascii')

                try {
                    socket.send(search, 0, search.length, this.MULTICAST_PORT, this.MULTICAST_ADDR);
                } catch (ex) {
                    console.log(ex);
                }
            }, this.PING_INTERVAL);

        });

        socket.bind();
    }

    _getListener() {
        const server = net.createServer(client => {
            let buffer = '';

            client.on('error', err => {
                console.log(`discovery.js error: ${err}`);
            });

            client.on('data', (data) => {
                buffer += data.toString();
            });

            client.on('end', () => {
                const hubInfo = this._deserializeHubInfo(buffer);
                if (hubInfo.ip !== undefined) {
                    this._hubManager.addHub(hubInfo);
                    this.emit('hubconnected', hubInfo);
                }
            });
            client.pipe(client);
        });
        server.on('error', (err) => {
            console.log(err);
            throw err;
        });
        server.listen(this.LISTENER_PORT, () => {
            console.log('server bound');
        });

        return server;
    }

    _deserializeHubInfo(response) {
        const pairs = {}

        response.split(';')
            .forEach(function(rawPair) {
                const splitted = rawPair.split(':')
                pairs[splitted[0]] = splitted[1]
            })

        return pairs
    }

    _getLocalIp() {
        const ifaces = os.networkInterfaces();
        let address = '0.0.0.0';

        Object.keys(ifaces).forEach(function(ifname) {
            ifaces[ifname].forEach(function(iface) {
                if (iface.family === 'IPv4' && iface.internal === false)
                    address = iface.address;

            });
        });

        return address;
    }

}
module.exports = Discovery;
