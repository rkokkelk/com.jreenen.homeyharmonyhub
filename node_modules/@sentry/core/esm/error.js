/** An error emitted by Sentry SDKs and related utilities. */
export class SentryError extends Error {
    constructor(message) {
        super(message);
        this.message = message;
        // tslint:disable:no-unsafe-any
        this.name = new.target.prototype.constructor.name;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
//# sourceMappingURL=error.js.map