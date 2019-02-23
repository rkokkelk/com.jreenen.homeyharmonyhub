import { SentryResponse, Transport } from '@sentry/types/esm';
/** Noop transport */
export declare class NoopTransport implements Transport {
    /**
     * @inheritDoc
     */
    sendEvent(_: string): Promise<SentryResponse>;
    /**
     * @inheritDoc
     */
    close(_?: number): Promise<boolean>;
}
