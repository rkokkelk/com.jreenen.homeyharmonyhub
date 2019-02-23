import { addGlobalEventProcessor, getCurrentHub } from '@sentry/hub/esm';
import { basename, relative } from '@sentry/utils/esm/path';
/** Rewrite event frames paths */
export class RewriteFrames {
    /**
     * @inheritDoc
     */
    constructor(options = {}) {
        /**
         * @inheritDoc
         */
        this.name = RewriteFrames.id;
        /**
         * @inheritDoc
         */
        this.iteratee = async (frame) => {
            if (frame.filename && frame.filename.startsWith('/')) {
                const base = this.root ? relative(this.root, frame.filename) : basename(frame.filename);
                frame.filename = `app:///${base}`;
            }
            return frame;
        };
        if (options.root) {
            this.root = options.root;
        }
        if (options.iteratee) {
            this.iteratee = options.iteratee;
        }
    }
    /**
     * @inheritDoc
     */
    setupOnce() {
        addGlobalEventProcessor(async (event) => {
            const self = getCurrentHub().getIntegration(RewriteFrames);
            if (self) {
                return self.process(event);
            }
            return event;
        });
    }
    /** JSDoc */
    async process(event) {
        const frames = this.getFramesFromEvent(event);
        if (frames) {
            for (const i in frames) {
                // tslint:disable-next-line
                frames[i] = await this.iteratee(frames[i]);
            }
        }
        return event;
    }
    /** JSDoc */
    getFramesFromEvent(event) {
        const exception = event.exception;
        if (exception) {
            try {
                // tslint:disable-next-line:no-unsafe-any
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
}
/**
 * @inheritDoc
 */
RewriteFrames.id = 'RewriteFrames';
//# sourceMappingURL=rewriteframes.js.map