import { getGlobalObject } from '@sentry/utils/esm/misc';
import { assign, safeNormalize } from '@sentry/utils/esm/object';
/**
 * Holds additional event information. {@link Scope.applyToEvent} will be
 * called by the client before an event will be sent.
 */
export class Scope {
    constructor() {
        /** Flag if notifiying is happening. */
        this.notifyingListeners = false;
        /** Callback for client to receive scope changes. */
        this.scopeListeners = [];
        /** Callback list that will be called after {@link applyToEvent}. */
        this.eventProcessors = [];
        /** Array of breadcrumbs. */
        this.breadcrumbs = [];
        /** User */
        this.user = {};
        /** Tags */
        this.tags = {};
        /** Extra */
        this.extra = {};
    }
    /** Add internal on change listener. */
    addScopeListener(callback) {
        this.scopeListeners.push(callback);
    }
    /** Add new event processor that will be called after {@link applyToEvent}. */
    addEventProcessor(callback) {
        this.eventProcessors.push(callback);
        return this;
    }
    /**
     * This will be called on every set call.
     */
    notifyScopeListeners() {
        if (!this.notifyingListeners) {
            this.notifyingListeners = true;
            setTimeout(() => {
                this.scopeListeners.forEach(callback => {
                    callback(this);
                });
                this.notifyingListeners = false;
            });
        }
    }
    /**
     * This will be called after {@link applyToEvent} is finished.
     */
    async notifyEventProcessors(event, hint) {
        let processedEvent = event;
        for (const processor of [...getGlobalEventProcessors(), ...this.eventProcessors]) {
            try {
                processedEvent = await processor({ ...processedEvent }, hint);
                if (processedEvent === null) {
                    return null;
                }
            }
            catch (e) {
                continue;
            }
        }
        return processedEvent;
    }
    /**
     * Updates user context information for future events.
     * @param user User context object to be set in the current context.
     */
    setUser(user) {
        this.user = safeNormalize(user);
        this.notifyScopeListeners();
        return this;
    }
    /**
     * Updates tags context information for future events.
     * @param tags Tags context object to merge into current context.
     */
    setTag(key, value) {
        this.tags = { ...this.tags, [key]: safeNormalize(value) };
        this.notifyScopeListeners();
        return this;
    }
    /**
     * Updates extra context information for future events.
     * @param extra context object to merge into current context.
     */
    setExtra(key, extra) {
        this.extra = { ...this.extra, [key]: safeNormalize(extra) };
        this.notifyScopeListeners();
        return this;
    }
    /**
     * Sets the fingerprint on the scope to send with the events.
     * @param fingerprint string[] to group events in Sentry.
     */
    setFingerprint(fingerprint) {
        this.fingerprint = safeNormalize(fingerprint);
        this.notifyScopeListeners();
        return this;
    }
    /**
     * Sets the level on the scope for future events.
     * @param level string {@link Severity}
     */
    setLevel(level) {
        this.level = safeNormalize(level);
        this.notifyScopeListeners();
        return this;
    }
    /**
     * Inherit values from the parent scope.
     * @param scope to clone.
     */
    static clone(scope) {
        const newScope = new Scope();
        assign(newScope, scope, {
            scopeListeners: [],
        });
        if (scope) {
            newScope.extra = assign(scope.extra);
            newScope.tags = assign(scope.tags);
            newScope.breadcrumbs = [...scope.breadcrumbs];
            newScope.eventProcessors = [...scope.eventProcessors];
        }
        return newScope;
    }
    /** Clears the current scope and resets its properties. */
    clear() {
        this.breadcrumbs = [];
        this.tags = {};
        this.extra = {};
        this.user = {};
        this.level = undefined;
        this.fingerprint = undefined;
        this.notifyScopeListeners();
    }
    /**
     * Sets the breadcrumbs in the scope
     * @param breadcrumbs Breadcrumb
     * @param maxBreadcrumbs number of max breadcrumbs to merged into event.
     */
    addBreadcrumb(breadcrumb, maxBreadcrumbs) {
        this.breadcrumbs =
            maxBreadcrumbs !== undefined && maxBreadcrumbs >= 0
                ? [...this.breadcrumbs, safeNormalize(breadcrumb)].slice(-maxBreadcrumbs)
                : [...this.breadcrumbs, safeNormalize(breadcrumb)];
        this.notifyScopeListeners();
    }
    /**
     * Applies fingerprint from the scope to the event if there's one,
     * uses message if there's one instead or get rid of empty fingerprint
     */
    applyFingerprint(event) {
        // Make sure it's an array first and we actually have something in place
        event.fingerprint = event.fingerprint
            ? Array.isArray(event.fingerprint)
                ? event.fingerprint
                : [event.fingerprint]
            : [];
        // If we have something on the scope, then merge it with event
        if (this.fingerprint) {
            event.fingerprint = event.fingerprint.concat(this.fingerprint);
        }
        else if (event.message) {
            // If not, but we have message, use it instead
            event.fingerprint = event.fingerprint.concat(event.message);
        }
        // If we have no data at all, remove empty array default
        if (event.fingerprint && !event.fingerprint.length) {
            delete event.fingerprint;
        }
    }
    /**
     * Applies the current context and fingerprint to the event.
     * Note that breadcrumbs will be added by the client.
     * Also if the event has already breadcrumbs on it, we do not merge them.
     * @param event SentryEvent
     * @param hint May contain additional informartion about the original exception.
     * @param maxBreadcrumbs number of max breadcrumbs to merged into event.
     */
    async applyToEvent(event, hint, maxBreadcrumbs) {
        if (this.extra && Object.keys(this.extra).length) {
            event.extra = { ...this.extra, ...event.extra };
        }
        if (this.tags && Object.keys(this.tags).length) {
            event.tags = { ...this.tags, ...event.tags };
        }
        if (this.user && Object.keys(this.user).length) {
            event.user = { ...this.user, ...event.user };
        }
        if (this.level) {
            event.level = this.level;
        }
        this.applyFingerprint(event);
        const hasNoBreadcrumbs = !event.breadcrumbs || event.breadcrumbs.length === 0;
        if (hasNoBreadcrumbs && this.breadcrumbs.length > 0) {
            event.breadcrumbs =
                maxBreadcrumbs !== undefined && maxBreadcrumbs >= 0
                    ? this.breadcrumbs.slice(-maxBreadcrumbs)
                    : this.breadcrumbs;
        }
        return this.notifyEventProcessors(event, hint);
    }
}
/**
 * Retruns the global event processors.
 */
function getGlobalEventProcessors() {
    const global = getGlobalObject();
    global.__SENTRY__ = global.__SENTRY__ || {};
    global.__SENTRY__.globalEventProcessors = global.__SENTRY__.globalEventProcessors || [];
    return global.__SENTRY__.globalEventProcessors;
}
/**
 * Add a EventProcessor to be kept globally.
 * @param callback EventProcessor to add
 */
export function addGlobalEventProcessor(callback) {
    getGlobalEventProcessors().push(callback);
}
//# sourceMappingURL=scope.js.map