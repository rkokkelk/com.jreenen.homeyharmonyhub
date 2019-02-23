import { getCurrentHub } from '@sentry/hub/esm';
import { logger } from '@sentry/utils/esm/logger';
/**
 * Internal function to create a new SDK client instance. The client is
 * installed and then bound to the current scope.
 *
 * @param clientClass The client class to instanciate.
 * @param options Options to pass to the client.
 * @returns The installed and bound client instance.
 */
export function initAndBind(clientClass, options) {
    if (options.debug === true) {
        logger.enable();
    }
    const client = new clientClass(options);
    getCurrentHub().bindClient(client);
    client.install();
}
//# sourceMappingURL=sdk.js.map