let originalFunctionToString;
/** Patch toString calls to return proper name for wrapped functions */
export class FunctionToString {
    constructor() {
        /**
         * @inheritDoc
         */
        this.name = FunctionToString.id;
    }
    /**
     * @inheritDoc
     */
    setupOnce() {
        originalFunctionToString = Function.prototype.toString;
        Function.prototype.toString = function (...args) {
            const context = this.__sentry__ ? this.__sentry_original__ : this;
            // tslint:disable-next-line:no-unsafe-any
            return originalFunctionToString.apply(context, args);
        };
    }
}
/**
 * @inheritDoc
 */
FunctionToString.id = 'FunctionToString';
//# sourceMappingURL=functiontostring.js.map