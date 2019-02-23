import { urlEncode } from '@sentry/utils/esm/object';
import { Dsn } from './dsn';
const SENTRY_API_VERSION = '7';
/** Helper class to provide urls to different Sentry endpoints. */
export class API {
    /** Create a new instance of API */
    constructor(dsn) {
        this.dsn = dsn;
        this.dsnObject = new Dsn(dsn);
    }
    /** Returns the Dsn object. */
    getDsn() {
        return this.dsnObject;
    }
    /** Returns a string with auth headers in the url to the store endpoint. */
    getStoreEndpoint() {
        return `${this.getBaseUrl()}${this.getStoreEndpointPath()}`;
    }
    /** Returns the store endpoint with auth added in url encoded. */
    getStoreEndpointWithUrlEncodedAuth() {
        const dsn = this.dsnObject;
        const auth = {
            sentry_key: dsn.user,
            sentry_version: SENTRY_API_VERSION,
        };
        // Auth is intentionally sent as part of query string (NOT as custom HTTP header)
        // to avoid preflight CORS requests
        return `${this.getStoreEndpoint()}?${urlEncode(auth)}`;
    }
    /** Returns the base path of the url including the port. */
    getBaseUrl() {
        const dsn = this.dsnObject;
        const protocol = dsn.protocol ? `${dsn.protocol}:` : '';
        const port = dsn.port ? `:${dsn.port}` : '';
        return `${protocol}//${dsn.host}${port}`;
    }
    /** Returns only the path component for the store endpoint. */
    getStoreEndpointPath() {
        const dsn = this.dsnObject;
        return `${dsn.path ? `/${dsn.path}` : ''}/api/${dsn.projectId}/store/`;
    }
    /** Returns an object that can be used in request headers. */
    getRequestHeaders(clientName, clientVersion) {
        const dsn = this.dsnObject;
        const header = [`Sentry sentry_version=${SENTRY_API_VERSION}`];
        header.push(`sentry_timestamp=${new Date().getTime()}`);
        header.push(`sentry_client=${clientName}/${clientVersion}`);
        header.push(`sentry_key=${dsn.user}`);
        if (dsn.pass) {
            header.push(`sentry_secret=${dsn.pass}`);
        }
        return {
            'Content-Type': 'application/json',
            'X-Sentry-Auth': header.join(', '),
        };
    }
    /** Returns the url to the report dialog endpoint. */
    getReportDialogEndpoint(dialogOptions = {}) {
        const dsn = this.dsnObject;
        const endpoint = `${this.getBaseUrl()}${dsn.path ? `/${dsn.path}` : ''}/api/embed/error-page/`;
        const encodedOptions = [];
        encodedOptions.push(`dsn=${dsn.toString()}`);
        for (const key in dialogOptions) {
            if (key === 'user') {
                if (!dialogOptions.user) {
                    continue;
                }
                if (dialogOptions.user.name) {
                    encodedOptions.push(`name=${encodeURIComponent(dialogOptions.user.name)}`);
                }
                if (dialogOptions.user.email) {
                    encodedOptions.push(`email=${encodeURIComponent(dialogOptions.user.email)}`);
                }
            }
            else {
                encodedOptions.push(`${encodeURIComponent(key)}=${encodeURIComponent(dialogOptions[key])}`);
            }
        }
        if (encodedOptions.length) {
            return `${endpoint}?${encodedOptions.join('&')}`;
        }
        return endpoint;
    }
}
//# sourceMappingURL=api.js.map