import { __assign } from "tslib";
/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { captureException, getCurrentHub, startTransaction, withScope } from '@sentry/core';
import { extractTraceparentData } from '@sentry/tracing';
import { extractNodeRequestData, forget, isPlainObject, isString, logger, stripUrlQueryAndFragment, } from '@sentry/utils';
import * as domain from 'domain';
import * as os from 'os';
import * as url from 'url';
import { flush } from './sdk';
var DEFAULT_SHUTDOWN_TIMEOUT = 2000;
/**
 * Express-compatible tracing handler.
 * @see Exposed as `Handlers.tracingHandler`
 */
export function tracingHandler() {
    return function sentryTracingMiddleware(req, res, next) {
        // TODO: At this point `req.route.path` (which we use in `extractTransaction`) is not available
        // but `req.path` or `req.url` should do the job as well. We could unify this here.
        var reqMethod = (req.method || '').toUpperCase();
        var reqUrl = req.url && stripUrlQueryAndFragment(req.url);
        // If there is a trace header set, we extract the data from it (parentSpanId, traceId, and sampling decision)
        var traceparentData;
        if (req.headers && isString(req.headers['sentry-trace'])) {
            traceparentData = extractTraceparentData(req.headers['sentry-trace']);
        }
        var transaction = startTransaction(__assign({ name: reqMethod + " " + reqUrl, op: 'http.server' }, traceparentData));
        // We put the transaction on the scope so users can attach children to it
        getCurrentHub().configureScope(function (scope) {
            scope.setSpan(transaction);
        });
        // We also set __sentry_transaction on the response so people can grab the transaction there to add
        // spans to it later.
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        res.__sentry_transaction = transaction;
        res.once('finish', function () {
            transaction.setHttpStatus(res.statusCode);
            transaction.finish();
        });
        next();
    };
}
/** JSDoc */
function extractTransaction(req, type) {
    try {
        // Express.js shape
        var request = req;
        var routePath = void 0;
        try {
            routePath = url.parse(request.originalUrl || request.url).pathname;
        }
        catch (_oO) {
            routePath = request.route.path;
        }
        switch (type) {
            case 'path': {
                return routePath;
            }
            case 'handler': {
                return request.route.stack[0].name;
            }
            case 'methodPath':
            default: {
                var method = request.method.toUpperCase();
                return method + " " + routePath;
            }
        }
    }
    catch (_oO) {
        return undefined;
    }
}
/** Default user keys that'll be used to extract data from the request */
var DEFAULT_USER_KEYS = ['id', 'username', 'email'];
/** JSDoc */
function extractUserData(user, keys) {
    var extractedUser = {};
    var attributes = Array.isArray(keys) ? keys : DEFAULT_USER_KEYS;
    attributes.forEach(function (key) {
        if (user && key in user) {
            extractedUser[key] = user[key];
        }
    });
    return extractedUser;
}
/**
 * Enriches passed event with request data.
 *
 * @param event Will be mutated and enriched with req data
 * @param req Request object
 * @param options object containing flags to enable functionality
 * @hidden
 */
export function parseRequest(event, req, options) {
    // eslint-disable-next-line no-param-reassign
    options = __assign({ ip: false, request: true, serverName: true, transaction: true, user: true, version: true }, options);
    if (options.version) {
        event.contexts = __assign(__assign({}, event.contexts), { runtime: {
                name: 'node',
                version: global.process.version,
            } });
    }
    if (options.request) {
        // if the option value is `true`, use the default set of keys by not passing anything to `extractNodeRequestData()`
        var extractedRequestData = Array.isArray(options.request)
            ? extractNodeRequestData(req, options.request)
            : extractNodeRequestData(req);
        event.request = __assign(__assign({}, event.request), extractedRequestData);
    }
    if (options.serverName && !event.server_name) {
        event.server_name = global.process.env.SENTRY_NAME || os.hostname();
    }
    if (options.user) {
        var extractedUser = req.user && isPlainObject(req.user) ? extractUserData(req.user, options.user) : {};
        if (Object.keys(extractedUser)) {
            event.user = __assign(__assign({}, event.user), extractedUser);
        }
    }
    // client ip:
    //   node: req.connection.remoteAddress
    //   express, koa: req.ip
    if (options.ip) {
        var ip = req.ip || (req.connection && req.connection.remoteAddress);
        if (ip) {
            event.user = __assign(__assign({}, event.user), { ip_address: ip });
        }
    }
    if (options.transaction && !event.transaction) {
        var transaction = extractTransaction(req, options.transaction);
        if (transaction) {
            event.transaction = transaction;
        }
    }
    return event;
}
/**
 * Express compatible request handler.
 * @see Exposed as `Handlers.requestHandler`
 */
export function requestHandler(options) {
    return function sentryRequestMiddleware(req, res, next) {
        if (options && options.flushTimeout && options.flushTimeout > 0) {
            // eslint-disable-next-line @typescript-eslint/unbound-method
            var _end_1 = res.end;
            res.end = function (chunk, encoding, cb) {
                var _this = this;
                flush(options.flushTimeout)
                    .then(function () {
                    _end_1.call(_this, chunk, encoding, cb);
                })
                    .then(null, function (e) {
                    logger.error(e);
                });
            };
        }
        var local = domain.create();
        local.add(req);
        local.add(res);
        local.on('error', next);
        local.run(function () {
            getCurrentHub().configureScope(function (scope) {
                return scope.addEventProcessor(function (event) { return parseRequest(event, req, options); });
            });
            next();
        });
    };
}
/** JSDoc */
function getStatusCodeFromResponse(error) {
    var statusCode = error.status || error.statusCode || error.status_code || (error.output && error.output.statusCode);
    return statusCode ? parseInt(statusCode, 10) : 500;
}
/** Returns true if response code is internal server error */
function defaultShouldHandleError(error) {
    var status = getStatusCodeFromResponse(error);
    return status >= 500;
}
/**
 * Express compatible error handler.
 * @see Exposed as `Handlers.errorHandler`
 */
export function errorHandler(options) {
    return function sentryErrorMiddleware(error, _req, res, next) {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        var shouldHandleError = (options && options.shouldHandleError) || defaultShouldHandleError;
        if (shouldHandleError(error)) {
            withScope(function (_scope) {
                // For some reason we need to set the transaction on the scope again
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                var transaction = res.__sentry_transaction;
                if (transaction && _scope.getSpan() === undefined) {
                    _scope.setSpan(transaction);
                }
                var eventId = captureException(error);
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                res.sentry = eventId;
                next(error);
            });
            return;
        }
        next(error);
    };
}
/**
 * @hidden
 */
export function logAndExitProcess(error) {
    // eslint-disable-next-line no-console
    console.error(error && error.stack ? error.stack : error);
    var client = getCurrentHub().getClient();
    if (client === undefined) {
        logger.warn('No NodeClient was defined, we are exiting the process now.');
        global.process.exit(1);
        return;
    }
    var options = client.getOptions();
    var timeout = (options && options.shutdownTimeout && options.shutdownTimeout > 0 && options.shutdownTimeout) ||
        DEFAULT_SHUTDOWN_TIMEOUT;
    forget(client.close(timeout).then(function (result) {
        if (!result) {
            logger.warn('We reached the timeout for emptying the request buffer, still exiting now!');
        }
        global.process.exit(1);
    }));
}
//# sourceMappingURL=handlers.js.map