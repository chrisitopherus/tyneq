import { createGeneratorOperator } from '../../extensibility/createOperator';

// ─────────────────────────────────────────────────────────────────────────────
//  createGeneratorOperator() demo — lowest-ceremony registration
// ─────────────────────────────────────────────────────────────────────────────
//
//  This file demonstrates the simplest possible way to define and register an
//  operator: a single call with an inline generator. The entire operator — logic,
//  registration, and (below) typings — lives in this one file.
//
//  When to prefer this over @operator() or createOperator():
//    - The logic can be expressed cleanly as a generator (most streaming operators can)
//    - No need to access internal state (IEnumerator lifecycle, disposal, etc.)
//    - Maximum brevity: you want the minimum viable operator definition
//
//  Tradeoff vs. @operator() class approach:
//    - No named class → harder to test in isolation
//    - No custom IEnumerator lifecycle (no early disposal hook)
//    - Generator yield semantics may allocate IteratorResult objects per element
//      (micro-benchmark irrelevant for most real workloads)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Places a `delimiter` element between every pair of consecutive elements.
 *
 * @remarks
 * The first and last elements are never preceded/followed by the delimiter.
 * The result length is `2 * sourceLength - 1` for a non-empty source
 * (or 0 for an empty source/single-element source).
 *
 * ```ts
 * Tyneq.from([1, 2, 3])
 *     .intersperse(0)
 *     .toArray();
 * // → [1, 0, 2, 0, 3]
 *
 * Tyneq.from(['a', 'b', 'c'])
 *     .intersperse('-')
 *     .toArray();
 * // → ['a', '-', 'b', '-', 'c']
 *
 * Tyneq.from([42])
 *     .intersperse(0)
 *     .toArray();
 * // → [42]   (single element: no delimiter needed)
 *
 * Tyneq.from([])
 *     .intersperse(0)
 *     .toArray();
 * // → []
 * ```
 *
 * **Performance**: O(1) space (streaming generator), O(n) time when enumerated.
 *
 * **Registration method**: `createGeneratorOperator()` — the entire implementation
 * is a single generator function. No class, no constructor, no base class changes.
 *
 * @see {@link ITyneqEnumerable.intersperse} for the public API signature.
 */
createGeneratorOperator<any, any, [any]>({
    name: 'intersperse',
    *generator(source: Iterable<any>, delimiter: any): IterableIterator<any> {
        let first = true;
        for (const item of source) {
            if (!first) yield delimiter;
            yield item;
            first = false;
        }
    }
});
