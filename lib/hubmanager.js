const http = require('http');
const parse = require('url').parse;
const EventEmitter = require('events');

const hub = require('./hub.js')

let hubs = {};
let instance = null;
const refreshTimeout = 5000;

class HubManager extends EventEmitter {
    constructor() {
        super();

        if (!instance)
            instance = this;

        return instance;
    }

    _retrieve_hub_info(ip, port, callback) {
        var timeout = setTimeout(() => {
            request.abort();
        }, refreshTimeout);

        const url = parse('http://' + ip + ':' + port);
        url.method = 'POST';
        url.headers = {
            'Origin': 'http://localhost.nebula.myharmony.com',
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Accept-Charset': 'utf-8'
        };

        let postdata = JSON.stringify({
            id: 1,
            cmd: "connect.discoveryinfo?get",
            params: {}
        });

        let request = http.request(url, (response) => {
            let data = '';

            response.on('data', (chunk) => {
                data += chunk;
            });

            response.on('end', () => {
                let error = null;
                let result = {};

                try {
                    result = JSON.parse(data);
                } catch (e) {
                    error = e;
                }

                clearTimeout(timeout);
                callback(error, result);
            });

            response.on('error', (error) => {
                clearTimeout(timeout);
                callback(error);
            });
        });

        request.on('error', (error) => {
            clearTimeout(timeout);
            callback(error);
        });

        request.end(postdata);
    }

    connectToHub(host) {
        return new Promise((resolve, reject) => {
            let hubInstance = hubs[host];

            if (hubInstance == undefined) {
                this._retrieve_hub_info(host, 8088, (error, result) => {
                    if (error) {
                        console.log(error);
                        return reject(error);
                    }

                    if (!result.hasOwnProperty('data')) {
                        console.log('connectToHub: no data object')
                        return reject(error);
                    }

                    let hubInstance = new hub(this, result.data);
                    hubs[host] = hubInstance;

                    resolve(hubInstance);
                });
            } else {
                resolve(hubInstance);
            }
        })
    }
}
module.exports = HubManager