import { logger } from '@sentry/utils/esm/logger';
import { serialize } from '@sentry/utils/esm/object';
import { SentryError } from './error';
import { NoopTransport } from './transports/noop';
/**
 * This is the base implemention of a Backend.
 */
export class BaseBackend {
    /** Creates a new browser backend instance. */
    constructor(options) {
        this.options = options;
        if (!this.options.dsn) {
            logger.warn('No DSN provided, backend will not do anything.');
        }
        this.transport = this.setupTransport();
    }
    /**
     * Sets up the transport so it can be used later to send requests.
     */
    setupTransport() {
        return new NoopTransport();
    }
    /**
     * @inheritDoc
     */
    async eventFromException(_exception, _hint) {
        throw new SentryError('Backend has to implement `eventFromException` method');
    }
    /**
     * @inheritDoc
     */
    async eventFromMessage(_message, _level, _hint) {
        throw new SentryError('Backend has to implement `eventFromMessage` method');
    }
    /**
     * @inheritDoc
     */
    async sendEvent(event) {
        // TODO: Remove with v5
        // tslint:disable-next-line
        if (this.transport.captureEvent) {
            // tslint:disable-next-line
            return this.transport.captureEvent(event);
        }
        // --------------------
        return this.transport.sendEvent(serialize(event));
    }
    /**
     * @inheritDoc
     */
    storeBreadcrumb(_) {
        return true;
    }
    /**
     * @inheritDoc
     */
    storeScope(_) {
        // Noop
    }
    /**
     * @inheritDoc
     */
    getTransport() {
        return this.transport;
    }
}
//# sourceMappingURL=basebackend.js.map