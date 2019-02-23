import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { mkdirpSync } from './fs';
/**
 * Note, this class is only compatible with Node.
 * Lazily serializes data to a JSON file to persist. When created, it loads data
 * from that file if it already exists.
 */
export class Store {
    /**
     * Creates a new store.
     *
     * @param path A unique filename to store this data.
     * @param id A unique filename to store this data.
     * @param initial An initial value to initialize data with.
     */
    constructor(path, id, initial) {
        this.path = join(path, `${id}.json`);
        this.initial = initial;
        this.flushing = false;
    }
    /**
     * Updates data by replacing it with the given value.
     * @param next New data to replace the previous one.
     */
    set(next) {
        this.data = next;
        if (!this.flushing) {
            this.flushing = true;
            setImmediate(() => {
                this.flush();
            });
        }
    }
    /**
     * Updates data by passing it through the given function.
     * @param fn A function receiving the current data and returning new one.
     */
    update(fn) {
        this.set(fn(this.get()));
    }
    /**
     * Returns the current data.
     *
     * When invoked for the first time, it will try to load previously stored data
     * from disk. If the file does not exist, the initial value provided to the
     * constructor is used.
     */
    get() {
        if (this.data === undefined) {
            try {
                this.data = existsSync(this.path) ? JSON.parse(readFileSync(this.path, 'utf8')) : this.initial;
            }
            catch (e) {
                this.data = this.initial;
            }
        }
        return this.data;
    }
    /** Returns store to its initial state */
    clear() {
        this.set(this.initial);
    }
    /** Serializes the current data into the JSON file. */
    flush() {
        try {
            mkdirpSync(dirname(this.path));
            writeFileSync(this.path, JSON.stringify(this.data));
        }
        catch (e) {
            // This usually fails due to anti virus scanners, issues in the file
            // system, or problems with network drives. We cannot fix or handle this
            // issue and must resume gracefully. Thus, we have to ignore this error.
        }
        finally {
            this.flushing = false;
        }
    }
}
//# sourceMappingURL=store.js.map