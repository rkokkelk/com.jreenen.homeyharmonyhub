import { logger } from '@sentry/utils/esm/logger';
/**
 * @deprecated
 * This file can be safely removed in the next major bump
 */
/** Adds SDK info to an event. */
export class SDKInformation {
    constructor() {
        /**
         * @inheritDoc
         */
        this.name = 'SDKInformation';
    }
    /**
     * @inheritDoc
     */
    setupOnce() {
        logger.warn("SDKInformation Integration is deprecated and can be safely removed. It's functionality has been merged into the SDK's core.");
    }
}
//# sourceMappingURL=sdkinformation.js.map