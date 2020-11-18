import { getCurrentHub } from '@sentry/core';
import { fill, parseSemver } from '@sentry/utils';
var NODE_VERSION = parseSemver(process.versions.node);
/** http module integration */
var Http = /** @class */ (function () {
    /**
     * @inheritDoc
     */
    function Http(options) {
        if (options === void 0) { options = {}; }
        /**
         * @inheritDoc
         */
        this.name = Http.id;
        this._breadcrumbs = typeof options.breadcrumbs === 'undefined' ? true : options.breadcrumbs;
        this._tracing = typeof options.tracing === 'undefined' ? false : options.tracing;
    }
    /**
     * @inheritDoc
     */
    Http.prototype.setupOnce = function () {
        // No need to instrument if we don't want to track anything
        if (!this._breadcrumbs && !this._tracing) {
            return;
        }
        var wrappedHandlerMaker = _createWrappedHandlerMaker(this._breadcrumbs, this._tracing);
        var httpModule = require('http');
        fill(httpModule, 'get', wrappedHandlerMaker);
        fill(httpModule, 'request', wrappedHandlerMaker);
        // NOTE: Prior to Node 9, `https` used internals of `http` module, thus we don't patch it.
        // If we do, we'd get double breadcrumbs and double spans for `https` calls.
        // It has been changed in Node 9, so for all versions equal and above, we patch `https` separately.
        if (NODE_VERSION.major && NODE_VERSION.major > 8) {
            var httpsModule = require('https');
            fill(httpsModule, 'get', wrappedHandlerMaker);
            fill(httpsModule, 'request', wrappedHandlerMaker);
        }
    };
    /**
     * @inheritDoc
     */
    Http.id = 'Http';
    return Http;
}());
export { Http };
/**
 * Function which creates a function which creates wrapped versions of internal `request` and `get` calls within `http`
 * and `https` modules. (NB: Not a typo - this is a creator^2!)
 *
 * @param breadcrumbsEnabled Whether or not to record outgoing requests as breadcrumbs
 * @param tracingEnabled Whether or not to record outgoing requests as tracing spans
 *
 * @returns A function which accepts the exiting handler and returns a wrapped handler
 */
function _createWrappedHandlerMaker(breadcrumbsEnabled, tracingEnabled) {
    return function wrappedHandlerMaker(originalHandler) {
        return function wrappedHandler(options) {
            var requestUrl = extractUrl(options);
            // we don't want to record requests to Sentry as either breadcrumbs or spans, so just use the original handler
            if (isSentryRequest(requestUrl)) {
                return originalHandler.apply(this, arguments);
            }
            var span;
            var transaction;
            var scope = getCurrentHub().getScope();
            if (scope && tracingEnabled) {
                transaction = scope.getTransaction();
                if (transaction) {
                    span = transaction.startChild({
                        description: (typeof options === 'string' || !options.method ? 'GET' : options.method) + " " + requestUrl,
                        op: 'request',
                    });
                }
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            return originalHandler
                .apply(this, arguments)
                .once('response', function (res) {
                if (breadcrumbsEnabled) {
                    addRequestBreadcrumb('response', requestUrl, this, res);
                }
                if (tracingEnabled && span) {
                    span.setHttpStatus(res.statusCode);
                    cleanDescription(options, this, span);
                    span.finish();
                }
            })
                .once('error', function () {
                if (breadcrumbsEnabled) {
                    addRequestBreadcrumb('error', requestUrl, this);
                }
                if (tracingEnabled && span) {
                    span.setHttpStatus(500);
                    cleanDescription(options, this, span);
                    span.finish();
                }
            });
        };
    };
}
/**
 * Captures Breadcrumb based on provided request/response pair
 */
function addRequestBreadcrumb(event, url, req, res) {
    if (!getCurrentHub().getIntegration(Http)) {
        return;
    }
    getCurrentHub().addBreadcrumb({
        category: 'http',
        data: {
            method: req.method,
            status_code: res && res.statusCode,
            url: url,
        },
        type: 'http',
    }, {
        event: event,
        request: req,
        response: res,
    });
}
/**
 * Assemble a URL to be used for breadcrumbs and spans.
 *
 * @param url URL string or object containing the component parts
 * @returns Fully-formed URL
 */
export function extractUrl(url) {
    if (typeof url === 'string') {
        return url;
    }
    var protocol = url.protocol || '';
    var hostname = url.hostname || url.host || '';
    // Don't log standard :80 (http) and :443 (https) ports to reduce the noise
    var port = !url.port || url.port === 80 || url.port === 443 ? '' : ":" + url.port;
    var path = url.path ? url.path : '/';
    // internal routes end up with too many slashes
    return (protocol + "//" + hostname + port + path).replace('///', '/');
}
/**
 * Handle an edge case with urls in the span description. Runs just before the span closes because it relies on
 * data from the response object.
 *
 * @param requestOptions Configuration data for the request
 * @param response Response object
 * @param span Span representing the request
 */
function cleanDescription(requestOptions, response, span) {
    // There are some libraries which don't pass the request protocol in the options object, so attempt to retrieve it
    // from the response and run the URL processing again. We only do this in the presence of a (non-empty) host value,
    // because if we're missing both, it's likely we're dealing with an internal route, in which case we don't want to be
    // jamming a random `http:` on the front of it.
    if (typeof requestOptions !== 'string' && !Object.keys(requestOptions).includes('protocol') && requestOptions.host) {
        // Neither http.IncomingMessage nor any of its ancestors have an `agent` property in their type definitions, and
        // http.Agent doesn't have a `protocol` property in its type definition. Nonetheless, at least one request library
        // (superagent) arranges things that way, so might as well give it a shot.
        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
            requestOptions.protocol = response.agent.protocol;
            span.description = (requestOptions.method || 'GET') + " " + extractUrl(requestOptions);
        }
        catch (error) {
            // well, we tried
        }
    }
}
/**
 * Checks whether given url points to Sentry server
 * @param url url to verify
 */
function isSentryRequest(url) {
    var client = getCurrentHub().getClient();
    if (!url || !client) {
        return false;
    }
    var dsn = client.getDsn();
    if (!dsn) {
        return false;
    }
    return url.indexOf(dsn.host) !== -1;
}
//# sourceMappingURL=http.js.map