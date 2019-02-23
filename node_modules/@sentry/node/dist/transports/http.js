"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var core_1 = require("@sentry/core");
var http = require("http");
var HttpsProxyAgent = require("https-proxy-agent");
var base_1 = require("./base");
/** Node http module transport */
var HTTPTransport = /** @class */ (function (_super) {
    tslib_1.__extends(HTTPTransport, _super);
    /** Create a new instance and set this.agent */
    function HTTPTransport(options) {
        var _this = _super.call(this, options) || this;
        _this.options = options;
        _this.module = http;
        var proxy = options.httpProxy || process.env.http_proxy;
        _this.client = proxy
            ? // tslint:disable-next-line:no-unsafe-any
                new HttpsProxyAgent(proxy)
            : new http.Agent({ keepAlive: false, maxSockets: 30, timeout: 2000 });
        return _this;
    }
    /**
     * @inheritDoc
     */
    HTTPTransport.prototype.sendEvent = function (body) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                if (!this.module) {
                    throw new core_1.SentryError('No module available in HTTPTransport');
                }
                return [2 /*return*/, this.sendWithModule(this.module, body)];
            });
        });
    };
    return HTTPTransport;
}(base_1.BaseTransport));
exports.HTTPTransport = HTTPTransport;
//# sourceMappingURL=http.js.map