import { BaseBackend, Options } from '@sentry/core';
import { SentryEvent, SentryEventHint, Severity, Transport } from '@sentry/types';
/**
 * Configuration options for the Sentry Node SDK.
 * @see NodeClient for more information.
 */
export interface NodeOptions extends Options {
    [key: string]: any;
    /** Callback that is executed when a fatal global error occurs. */
    onFatalError?(error: Error): void;
    /** Sets an optional server name (device name) */
    serverName?: string;
    /** Maximum time to wait to drain the request queue, before the process is allowed to exit. */
    shutdownTimeout?: number;
    /** Set a HTTP proxy that should be used for outbound requests. */
    httpProxy?: string;
    /** Set a HTTPS proxy that should be used for outbound requests. */
    httpsProxy?: string;
    /** HTTPS proxy certificates path */
    caCerts?: string;
    /** Sets the number of context lines for each frame when loading a file. */
    frameContextLines?: number;
}
/** The Sentry Node SDK Backend. */
export declare class NodeBackend extends BaseBackend<NodeOptions> {
    /**
     * @inheritdoc
     */
    protected setupTransport(): Transport;
    /**
     * @inheritDoc
     */
    eventFromException(exception: any, hint?: SentryEventHint): Promise<SentryEvent>;
    /**
     * @inheritDoc
     */
    eventFromMessage(message: string, level?: Severity, hint?: SentryEventHint): Promise<SentryEvent>;
}
