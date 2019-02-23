import { addGlobalEventProcessor, getCurrentHub } from '@sentry/hub/esm';
import { logger } from '@sentry/utils/esm/logger';
import { getEventDescription } from '@sentry/utils/esm/misc';
/** Deduplication filter */
export class Dedupe {
    constructor() {
        /**
         * @inheritDoc
         */
        this.name = Dedupe.id;
    }
    /**
     * @inheritDoc
     */
    setupOnce() {
        addGlobalEventProcessor(async (currentEvent) => {
            const self = getCurrentHub().getIntegration(Dedupe);
            if (self) {
                // Juuust in case something goes wrong
                try {
                    if (self.shouldDropEvent(currentEvent, self.previousEvent)) {
                        return null;
                    }
                }
                catch (_oO) {
                    return (self.previousEvent = currentEvent);
                }
                return (self.previousEvent = currentEvent);
            }
            return currentEvent;
        });
    }
    /** JSDoc */
    shouldDropEvent(currentEvent, previousEvent) {
        if (!previousEvent) {
            return false;
        }
        if (this.isSameMessageEvent(currentEvent, previousEvent)) {
            logger.warn(`Event dropped due to being a duplicate of previous event (same message).\nEvent: ${getEventDescription(currentEvent)}`);
            return true;
        }
        if (this.isSameExceptionEvent(currentEvent, previousEvent)) {
            logger.warn(`Event dropped due to being a duplicate of previous event (same exception).\nEvent: ${getEventDescription(currentEvent)}`);
            return true;
        }
        return false;
    }
    /** JSDoc */
    isSameMessageEvent(currentEvent, previousEvent) {
        const currentMessage = currentEvent.message;
        const previousMessage = previousEvent.message;
        // If no event has a message, they were both exceptions, so bail out
        if (!currentMessage && !previousMessage) {
            return false;
        }
        // If only one event has a stacktrace, but not the other one, they are not the same
        if ((currentMessage && !previousMessage) || (!currentMessage && previousMessage)) {
            return false;
        }
        if (currentMessage !== previousMessage) {
            return false;
        }
        if (!this.isSameFingerprint(currentEvent, previousEvent)) {
            return false;
        }
        if (!this.isSameStacktrace(currentEvent, previousEvent)) {
            return false;
        }
        return true;
    }
    /** JSDoc */
    getFramesFromEvent(event) {
        const exception = event.exception;
        if (exception) {
            try {
                // @ts-ignore
                return exception.values[0].stacktrace.frames;
            }
            catch (_oO) {
                return undefined;
            }
        }
        else if (event.stacktrace) {
            return event.stacktrace.frames;
        }
        else {
            return undefined;
        }
    }
    /** JSDoc */
    isSameStacktrace(currentEvent, previousEvent) {
        let currentFrames = this.getFramesFromEvent(currentEvent);
        let previousFrames = this.getFramesFromEvent(previousEvent);
        // If no event has a fingerprint, they are assumed to be the same
        if (!currentFrames && !previousFrames) {
            return true;
        }
        // If only one event has a stacktrace, but not the other one, they are not the same
        if ((currentFrames && !previousFrames) || (!currentFrames && previousFrames)) {
            return false;
        }
        currentFrames = currentFrames;
        previousFrames = previousFrames;
        // If number of frames differ, they are not the same
        if (previousFrames.length !== currentFrames.length) {
            return false;
        }
        // Otherwise, compare the two
        for (let i = 0; i < previousFrames.length; i++) {
            const frameA = previousFrames[i];
            const frameB = currentFrames[i];
            if (frameA.filename !== frameB.filename ||
                frameA.lineno !== frameB.lineno ||
                frameA.colno !== frameB.colno ||
                frameA.function !== frameB.function) {
                return false;
            }
        }
        return true;
    }
    /** JSDoc */
    getExceptionFromEvent(event) {
        return event.exception && event.exception.values && event.exception.values[0];
    }
    /** JSDoc */
    isSameExceptionEvent(currentEvent, previousEvent) {
        const previousException = this.getExceptionFromEvent(previousEvent);
        const currentException = this.getExceptionFromEvent(currentEvent);
        if (!previousException || !currentException) {
            return false;
        }
        if (previousException.type !== currentException.type || previousException.value !== currentException.value) {
            return false;
        }
        if (!this.isSameFingerprint(currentEvent, previousEvent)) {
            return false;
        }
        if (!this.isSameStacktrace(currentEvent, previousEvent)) {
            return false;
        }
        return true;
    }
    /** JSDoc */
    isSameFingerprint(currentEvent, previousEvent) {
        let currentFingerprint = currentEvent.fingerprint;
        let previousFingerprint = previousEvent.fingerprint;
        // If no event has a fingerprint, they are assumed to be the same
        if (!currentFingerprint && !previousFingerprint) {
            return true;
        }
        // If only one event has a fingerprint, but not the other one, they are not the same
        if ((currentFingerprint && !previousFingerprint) || (!currentFingerprint && previousFingerprint)) {
            return false;
        }
        currentFingerprint = currentFingerprint;
        previousFingerprint = previousFingerprint;
        // Otherwise, compare the two
        try {
            return !!(currentFingerprint.join('') === previousFingerprint.join(''));
        }
        catch (_oO) {
            return false;
        }
    }
}
/**
 * @inheritDoc
 */
Dedupe.id = 'Dedupe';
//# sourceMappingURL=dedupe.js.map