import { Status } from '@sentry/types/esm';
/** Noop transport */
export class NoopTransport {
    /**
     * @inheritDoc
     */
    async sendEvent(_) {
        return Promise.resolve({
            reason: `NoopTransport: Event has been skipped because no Dsn is configured.`,
            status: Status.Skipped,
        });
    }
    /**
     * @inheritDoc
     */
    async close(_) {
        return Promise.resolve(true);
    }
}
//# sourceMappingURL=noop.js.map