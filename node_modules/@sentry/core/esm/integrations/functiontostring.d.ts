import { Integration } from '@sentry/types/esm';
/** Patch toString calls to return proper name for wrapped functions */
export declare class FunctionToString implements Integration {
    /**
     * @inheritDoc
     */
    name: string;
    /**
     * @inheritDoc
     */
    static id: string;
    /**
     * @inheritDoc
     */
    setupOnce(): void;
}
