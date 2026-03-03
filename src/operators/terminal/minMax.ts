import { IEnumerable, MinMaxResult } from '../../types/core';
import { terminal } from '../../extensibility/operatorDecorators';
import { TyneqTerminalOperator } from '../../core/operator/TyneqTerminalOperator';
import { SequenceContainsNoElementsError } from '../../core/errors/SequenceContainsNoElementsError';

// ─────────────────────────────────────────────────────────────────────────────
//  @terminal('minMax') registration demo
// ─────────────────────────────────────────────────────────────────────────────
//
//  This file shows how @terminal() works for operators that evaluate immediately
//  and return a concrete value (not another enumerable).
//
//  Previously, adding 'minMax' would require editing TyneqEnumerableBase.
//  Now: just decorate the class. Same structure as the streaming @operator() demo.
//
//  The default comparer uses JavaScript's built-in relational operators, which
//  work correctly for numbers and strings (standard LINQ behaviour).
// ─────────────────────────────────────────────────────────────────────────────

// MinMaxResult is defined in types/core.ts to avoid a circular dependency.
// Re-export it from there so consumers can import it from either location.
export type { MinMaxResult } from '../../types/core';

/** Default comparer: uses JS relational operators (works for numbers and strings). */
function defaultCompare<T>(a: T, b: T): number {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
}

/**
 * Terminal operator that returns both the minimum **and** maximum elements in a
 * single enumeration pass — O(n) time, O(1) space.
 *
 * @remarks
 * Calling `min()` and `max()` separately requires two full passes over the source.
 * `minMax()` fuses them into one, which matters for large sequences or expensive
 * iterators (e.g., database cursors, lazy I/O streams).
 *
 * ```ts
 * const { min, max } = Tyneq.from([3, 1, 4, 1, 5, 9, 2, 6])
 *     .minMax();
 * // → { min: 1, max: 9 }
 *
 * // Custom comparer — works with objects
 * const { min, max } = Tyneq.from(products)
 *     .minMax((a, b) => a.price - b.price);
 * // → { min: cheapest product, max: most expensive product }
 * ```
 *
 * **Performance**: O(n) time, O(1) space, single pass.
 *
 * **Registration method**: TC39 `@terminal()` class decorator.
 * Extends `TyneqTerminalOperator` and implements `process()` — the decorator
 * wires `seq.minMax()` to `new MinMaxOperator(seq, ...).process()` automatically.
 *
 * @typeParam T - Element type of the sequence.
 *
 * @see {@link MinMaxResult} for the return type.
 * @see {@link ITyneqEnumerable.minMax} for the public API signature.
 */
@terminal('minMax')
export class MinMaxOperator<T> extends TyneqTerminalOperator<T, MinMaxResult<T>> {

    declare private readonly comparer: (a: T, b: T) => number;

    /**
     * @param source    - The source sequence to evaluate.
     * @param comparer  - Optional comparison function. Defaults to JS relational operators.
     */
    public constructor(source: IEnumerable<T>, comparer?: (a: T, b: T) => number) {
        super(source);
        this.comparer = comparer ?? defaultCompare;
    }

    public override process(): MinMaxResult<T> {
        let min: T | undefined;
        let max: T | undefined;
        let hasElements = false;

        for (const item of this.source) {
            if (!hasElements) {
                min = item;
                max = item;
                hasElements = true;
            } else {
                if (this.comparer(item, min as T) < 0) min = item;
                if (this.comparer(item, max as T) > 0) max = item;
            }
        }

        if (!hasElements) {
            throw new SequenceContainsNoElementsError();
        }

        return { min: min as T, max: max as T };
    }
}
