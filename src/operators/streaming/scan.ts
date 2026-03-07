import { IEnumerable, IEnumerator } from '../../types/core';
import { operator } from '../../extensibility/operatorDecorators';
import { TyneqOperatorEnumerable } from '../../core/operator/TyneqOperatorEnumerable';
import { ScanEnumerator } from '../../enumerators/streaming/scan';
import { ArgumentUtility } from '../../utility/argumentUtility';
import { nameof } from '../../utility/nameof';

// ─────────────────────────────────────────────────────────────────────────────
//  @operator('scan')  registration demo
// ─────────────────────────────────────────────────────────────────────────────
//
//  This file shows how the NEW operator architecture works in practice.
//
//  Previously, adding 'scan' would require:
//    1. This class  ✓  (same as before)
//    2. ScanEnumerator  ✓  (same as before)
//    3. + Add import to TyneqEnumerableBase.ts  ✗  (eliminated)
//    4. + Add method body to TyneqEnumerableBase.ts  ✗  (eliminated)
//    5. + Add signature to ITyneqEnumerable in core.ts  ✓  (still needed for types)
//
//  Now:  just add @operator('scan') to the class. That's it.
//  The decorator fires when this module is evaluated (imported), patches the
//  prototype once, and every TyneqEnumerable instance gains .scan() instantly.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Streaming operator that emits a running accumulation over the sequence.
 *
 * @remarks
 * Like `Array.reduce`, but yields **every intermediate result** as a lazy stream
 * instead of returning only the final value. The seed itself is never yielded;
 * only the accumulated values are.
 *
 * ```ts
 * Tyneq.from([1, 2, 3, 4, 5])
 *     .scan(0, (acc, n) => acc + n)
 *     .toArray();
 * // → [1, 3, 6, 10, 15]
 * ```
 *
 * **Important contrast with `reduce`:**
 *
 * | Operator  | Returns         | Evaluates   |
 * |-----------|-----------------|-------------|
 * | `reduce`  | Final value     | Immediately (terminal) |
 * | `scan`    | Stream of partials | Lazily (streaming) |
 *
 * **Performance**: O(1) space (streaming), O(n) time when fully enumerated.
 *
 * **Registration method**: TC39 `@operator()` class decorator.
 * The `@operator('scan')` line is the **only wiring** needed — no changes to
 * `TyneqEnumerableBase` or its import list.
 *
 * This method uses deferred execution. The source sequence is not enumerated until the returned sequence is iterated.
 *
 * @typeParam TSource - Element type of the source sequence.
 * @typeParam TResult - Element type of the accumulated result sequence.
 *
 * @see {@link ScanEnumerator} for the iteration logic.
 * @see {@link ITyneqEnumerable.scan} for the public API signature.
 *
 * @group Operators
 * @category Streaming
 * @internal
 */
@operator('scan')
export class ScanOperatorEnumerable<TSource, TResult> extends TyneqOperatorEnumerable<TSource, TResult> {

    private readonly seed: TResult;
    private readonly accumulator: (acc: TResult, item: TSource) => TResult;

    /**
     * @param source      - The source sequence to accumulate over.
     * @param seed        - Initial accumulator value (not yielded).
     * @param accumulator - Function applied on each element: `(currentAcc, item) => newAcc`.
     */
    public constructor(
        source: IEnumerable<TSource>,
        seed: TResult,
        accumulator: (acc: TResult, item: TSource) => TResult
    ) {
        super(source);
        ArgumentUtility.checkNotOptional({ accumulator });
        this.seed = seed;
        this.accumulator = accumulator;
    }

    public override getEnumerator(): IEnumerator<TResult> {
        return new ScanEnumerator<TSource, TResult>(
            this.source[Symbol.iterator](),
            this.seed,
            this.accumulator
        );
    }
}
