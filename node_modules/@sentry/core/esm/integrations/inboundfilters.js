import { addGlobalEventProcessor, getCurrentHub } from '@sentry/hub/esm';
import { isRegExp } from '@sentry/utils/esm/is';
import { logger } from '@sentry/utils/esm/logger';
import { getEventDescription } from '@sentry/utils/esm/misc';
import { includes } from '@sentry/utils/esm/string';
// "Script error." is hard coded into browsers for errors that it can't read.
// this is the result of a script being pulled in from an external domain and CORS.
const DEFAULT_IGNORE_ERRORS = [/^Script error\.?$/, /^Javascript error: Script error\.? on line 0$/];
/** Inbound filters configurable by the user */
export class InboundFilters {
    constructor(options = {}) {
        this.options = options;
        /**
         * @inheritDoc
         */
        this.name = InboundFilters.id;
    }
    /**
     * @inheritDoc
     */
    setupOnce() {
        addGlobalEventProcessor(async (event) => {
            const hub = getCurrentHub();
            if (!hub) {
                return event;
            }
            const self = hub.getIntegration(InboundFilters);
            if (self) {
                const client = hub.getClient();
                const clientOptions = client ? client.getOptions() : {};
                const options = self.mergeOptions(clientOptions);
                if (self.shouldDropEvent(event, options)) {
                    return null;
                }
            }
            return event;
        });
    }
    /** JSDoc */
    shouldDropEvent(event, options) {
        if (this.isSentryError(event, options)) {
            logger.warn(`Event dropped due to being internal Sentry Error.\nEvent: ${getEventDescription(event)}`);
            return true;
        }
        if (this.isIgnoredError(event, options)) {
            logger.warn(`Event dropped due to being matched by \`ignoreErrors\` option.\nEvent: ${getEventDescription(event)}`);
            return true;
        }
        if (this.isBlacklistedUrl(event, options)) {
            logger.warn(`Event dropped due to being matched by \`blacklistUrls\` option.\nEvent: ${getEventDescription(event)}.\nUrl: ${this.getEventFilterUrl(event)}`);
            return true;
        }
        if (!this.isWhitelistedUrl(event, options)) {
            logger.warn(`Event dropped due to not being matched by \`whitelistUrls\` option.\nEvent: ${getEventDescription(event)}.\nUrl: ${this.getEventFilterUrl(event)}`);
            return true;
        }
        return false;
    }
    /** JSDoc */
    isSentryError(event, options = {}) {
        if (!options.ignoreInternal) {
            return false;
        }
        try {
            // tslint:disable-next-line:no-unsafe-any
            return event.exception.values[0].type === 'SentryError';
        }
        catch (_oO) {
            return false;
        }
    }
    /** JSDoc */
    isIgnoredError(event, options = {}) {
        if (!options.ignoreErrors || !options.ignoreErrors.length) {
            return false;
        }
        return this.getPossibleEventMessages(event).some(message => 
        // Not sure why TypeScript complains here...
        options.ignoreErrors.some(pattern => this.isMatchingPattern(message, pattern)));
    }
    /** JSDoc */
    isBlacklistedUrl(event, options = {}) {
        // TODO: Use Glob instead?
        if (!options.blacklistUrls || !options.blacklistUrls.length) {
            return false;
        }
        const url = this.getEventFilterUrl(event);
        return !url ? false : options.blacklistUrls.some(pattern => this.isMatchingPattern(url, pattern));
    }
    /** JSDoc */
    isWhitelistedUrl(event, options = {}) {
        // TODO: Use Glob instead?
        if (!options.whitelistUrls || !options.whitelistUrls.length) {
            return true;
        }
        const url = this.getEventFilterUrl(event);
        return !url ? true : options.whitelistUrls.some(pattern => this.isMatchingPattern(url, pattern));
    }
    /** JSDoc */
    mergeOptions(clientOptions = {}) {
        return {
            blacklistUrls: [...(this.options.blacklistUrls || []), ...(clientOptions.blacklistUrls || [])],
            ignoreErrors: [
                ...(this.options.ignoreErrors || []),
                ...(clientOptions.ignoreErrors || []),
                ...DEFAULT_IGNORE_ERRORS,
            ],
            ignoreInternal: typeof this.options.ignoreInternal !== 'undefined' ? this.options.ignoreInternal : true,
            whitelistUrls: [...(this.options.whitelistUrls || []), ...(clientOptions.whitelistUrls || [])],
        };
    }
    /** JSDoc */
    isMatchingPattern(value, pattern) {
        if (isRegExp(pattern)) {
            return pattern.test(value);
        }
        else if (typeof pattern === 'string') {
            return includes(value, pattern);
        }
        else {
            return false;
        }
    }
    /** JSDoc */
    getPossibleEventMessages(event) {
        if (event.message) {
            return [event.message];
        }
        else if (event.exception) {
            try {
                // tslint:disable-next-line:no-unsafe-any
                const { type, value } = event.exception.values[0];
                return [`${value}`, `${type}: ${value}`];
            }
            catch (oO) {
                logger.error(`Cannot extract message for event ${getEventDescription(event)}`);
                return [];
            }
        }
        else {
            return [];
        }
    }
    /** JSDoc */
    getEventFilterUrl(event) {
        try {
            if (event.stacktrace) {
                // tslint:disable:no-unsafe-any
                const frames = event.stacktrace.frames;
                return frames[frames.length - 1].filename;
            }
            else if (event.exception) {
                // tslint:disable:no-unsafe-any
                const frames = event.exception.values[0].stacktrace.frames;
                return frames[frames.length - 1].filename;
            }
            else {
                return null;
            }
        }
        catch (oO) {
            logger.error(`Cannot extract url for event ${getEventDescription(event)}`);
            return null;
        }
    }
}
/**
 * @inheritDoc
 */
InboundFilters.id = 'InboundFilters';
//# sourceMappingURL=inboundfilters.js.map