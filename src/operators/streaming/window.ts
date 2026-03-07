import { IEnumerable, IEnumerator, IEnumeratorFactory } from '../../types/core';
import { createOperator } from '../../extensibility/createOperator';

// ─────────────────────────────────────────────────────────────────────────────
//  createOperator() registration demo
// ─────────────────────────────────────────────────────────────────────────────
//
//  This file shows the FUNCTIONAL registration path — no class hierarchy needed.
//  The call to createOperator() at module level IS the registration.
//
//  When to prefer this over @operator():
//    - No need for a named operator class (logic fits in a closure / generator)
//    - Third-party authors who don't want to extend TyneqOperatorEnumerable
//    - Simple operators where a full class is overkill
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generator that produces sliding windows of exactly `size` elements.
 *
 * ```text
 * source: [1, 2, 3, 4, 5]  size = 3
 * yields: [[1,2,3], [2,3,4], [3,4,5]]
 * ```
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

// ─────────────────────────────────────────────────────────────────────────────
//  Registration — one call, no class, no base-class edits
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Produces sliding windows of `size` consecutive elements.
 *
 * @remarks
 * Each window is an independent array snapshot. Windows advance one element at
 * a time (stride = 1). Windows that cannot be fully filled (near the end of the
 * source) are **not** emitted — only complete windows are yielded.
 *
 * ```ts
 * Tyneq.from([1, 2, 3, 4, 5])
 *     .window(3)
 *     .toArray();
 * // → [[1,2,3], [2,3,4], [3,4,5]]
 *
 * Tyneq.from([1, 2])
 *     .window(3)
 *     .toArray();
 * // → []  (source shorter than window size — no complete windows)
 * ```
 *
 * **Performance**: O(size) space (ring buffer), O(n) time when enumerated.
 *
 * **Registration method**: `createOperator()` functional API.
 * No class definition or base class modification required.
 *
 * This method uses deferred execution. The source sequence is not enumerated until the returned sequence is iterated.
 *
 * @see {@link ITyneqEnumerable.window} for the public API signature.
 *
 * @group Operators
 * @category Streaming
 * @internal
 */
createOperator<any, any[], [number]>({
    name: 'window',
    factory(source: IEnumerable<any>, size: number): IEnumeratorFactory<any[]> {
        return {
            getEnumerator(): IEnumerator<any[]> {
                // IterableIterator is structurally compatible with IEnumerator
                return windowGenerator(source[Symbol.iterator](), size) as unknown as IEnumerator<any[]>;
            }
        };
    }
});
