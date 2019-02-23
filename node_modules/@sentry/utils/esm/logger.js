import { consoleSandbox, getGlobalObject } from './misc';
// TODO: Implement different loggers for different environments
const global = getGlobalObject();
/** JSDoc */
class Logger {
    /** JSDoc */
    constructor() {
        this.enabled = false;
    }
    /** JSDoc */
    disable() {
        this.enabled = false;
    }
    /** JSDoc */
    enable() {
        this.enabled = true;
    }
    /** JSDoc */
    log(...args) {
        if (!this.enabled) {
            return;
        }
        consoleSandbox(() => {
            global.console.log(`Sentry Logger [Log]: ${args.join(' ')}`); // tslint:disable-line:no-console
        });
    }
    /** JSDoc */
    warn(...args) {
        if (!this.enabled) {
            return;
        }
        consoleSandbox(() => {
            global.console.warn(`Sentry Logger [Warn]: ${args.join(' ')}`); // tslint:disable-line:no-console
        });
    }
    /** JSDoc */
    error(...args) {
        if (!this.enabled) {
            return;
        }
        consoleSandbox(() => {
            global.console.error(`Sentry Logger [Error]: ${args.join(' ')}`); // tslint:disable-line:no-console
        });
    }
}
const logger = new Logger();
export { logger };
//# sourceMappingURL=logger.js.map