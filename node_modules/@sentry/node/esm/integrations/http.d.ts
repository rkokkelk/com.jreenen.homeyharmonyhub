/// <reference types="node" />
import { Integration } from '@sentry/types';
import * as http from 'http';
/** http module integration */
export declare class Http implements Integration {
    /**
     * @inheritDoc
     */
    static id: string;
    /**
     * @inheritDoc
     */
    name: string;
    /**
     * @inheritDoc
     */
    private readonly _breadcrumbs;
    /**
     * @inheritDoc
     */
    private readonly _tracing;
    /**
     * @inheritDoc
     */
    constructor(options?: {
        breadcrumbs?: boolean;
        tracing?: boolean;
    });
    /**
     * @inheritDoc
     */
    setupOnce(): void;
}
/**
 * Assemble a URL to be used for breadcrumbs and spans.
 *
 * @param url URL string or object containing the component parts
 * @returns Fully-formed URL
 */
export declare function extractUrl(url: string | http.ClientRequestArgs): string;
//# sourceMappingURL=http.d.ts.map