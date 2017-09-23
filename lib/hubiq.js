const IQ = require('node-xmpp-stanza').IQ;

class HubIQ {
    constructor(id, xmlns, type, mime, from, action) {

        this.id = id;
        this.xmlns = xmlns;
        this.type = type;
        this.mime = mime;
        this.from = from;
        this.action = action;
    }

    getIQ() {
        return new Promise((resolve, reject) => {
            var iq = new IQ({
                type: this.type,
                id: this.id,
                from: this.from
            })

            iq.c('oa', {
                xmlns: this.xmlns,
                mime: this.mime
            }).t(this.action);

            resolve(iq);
        })
    }
}

module.exports = HubIQ