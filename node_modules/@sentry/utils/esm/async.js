/**
 * Consumes the promise and logs the error when it rejects.
 * @param promise A promise to forget.
 */
export function forget(promise) {
    promise.catch(e => {
        // TODO: Use a better logging mechanism
        console.error(e);
    });
}
/**
 * Helper to filter an array with asynchronous callbacks.
 *
 * @param array An array containing items to filter.
 * @param predicate An async predicate evaluated on every item.
 * @param thisArg Optional value passed as "this" into the callback.
 * @returns An array containing only values where the callback returned true.
 */
export async function filterAsync(array, predicate, thisArg) {
    const verdicts = await Promise.all(array.map(predicate, thisArg));
    return array.filter((_, index) => verdicts[index]);
}
//# sourceMappingURL=async.js.map