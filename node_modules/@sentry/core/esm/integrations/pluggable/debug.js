import { addGlobalEventProcessor, getCurrentHub } from '@sentry/hub/esm';
/** JSDoc */
export class Debug {
    /**
     * @inheritDoc
     */
    constructor(options) {
        /**
         * @inheritDoc
         */
        this.name = Debug.id;
        this.options = {
            debugger: false,
            stringify: false,
            ...options,
        };
    }
    /**
     * @inheritDoc
     */
    setupOnce() {
        addGlobalEventProcessor(async (event, hint) => {
            const self = getCurrentHub().getIntegration(Debug);
            if (self) {
                // tslint:disable:no-console
                // tslint:disable:no-debugger
                if (self.options.debugger) {
                    debugger;
                }
                if (self.options.stringify) {
                    console.log(JSON.stringify(event, null, 2));
                    if (hint) {
                        console.log(JSON.stringify(hint, null, 2));
                    }
                }
                else {
                    console.log(event);
                    if (hint) {
                        console.log(hint);
                    }
                }
            }
            return event;
        });
    }
}
/**
 * @inheritDoc
 */
Debug.id = 'Debug';
//# sourceMappingURL=debug.js.map