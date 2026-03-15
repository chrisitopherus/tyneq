import { IEnumerable, IEnumerator, IEnumeratorFactory } from "../../types/core";
import { createOperator } from "../../extensibility/createOperator";
import { ArgumentUtility } from "../../utility/argumentUtility";

/**
 * Generator that produces sliding windows of exactly `size` elements.
 *
 * A ring buffer of fixed capacity is maintained so no slice-per-window allocation
 * is needed until a full window is formed.
 */
function* windowGenerator<T>(source: Iterator<T>, size: number): IterableIterator<T[]> {
    if (size <= 0) return;

    const buffer: T[] = [];
    let result = source.next();

    while (!result.done) {
        buffer.push(result.value);

        if (buffer.length > size) {
            buffer.shift();
        }

        if (buffer.length === size) {
            yield buffer.slice(); // snapshot — caller owns this array
        }

        result = source.next();
    }
}

/**
 * Produces sliding windows of `size` consecutive elements.
 *
 * @remarks
 * Deferred. Source is not enumerated until the returned sequence is iterated.
 *
 * Each window is an independent array snapshot. Windows advance one element at a time
 * (stride = 1). Incomplete windows at the end of the source are not emitted.
 *
 * @see {@link ITyneqEnumerable.window} for the public API.
 *
 * @group Operators
 * @category Streaming
 * @internal
 */
createOperator({
    name: "window",
    factory(source: IEnumerable<unknown>, size: number): IEnumeratorFactory<unknown> {
        return {
            getEnumerator(): IEnumerator<unknown> {
                // IterableIterator is structurally compatible with IEnumerator
                return windowGenerator(source[Symbol.iterator](), size) as unknown as IEnumerator<unknown>;
            }
        };
    },
    validate(size) {  // size: number — inferred from factory
        ArgumentUtility.checkPositive({ size });
    }
});
