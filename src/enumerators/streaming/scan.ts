import { TyneqEnumerator } from '../../core/enumerators/TyneqEnumerator';
import { IEnumerator } from '../../types/core';

/**
 * Enumerator that emits a running accumulation of elements.
 *
 * @remarks
 * For each source element, applies the accumulator to the running total and
 * yields the updated accumulator value. The seed is **not** yielded; only
 * the accumulated results are.
 *
 * ```text
 * source:  [ 1,  2,  3,  4,  5 ]   seed = 0, acc = (a, b) => a + b
 * yields:  [ 1,  3,  6, 10, 15 ]
 * ```
 *
 * **Performance**: O(1) space (streaming), O(n) time.
 *
 * @typeParam TSource - Type of elements in the source sequence.
 * @typeParam TResult - Type of the accumulated result (may differ from TSource).
 *
 * @see {@link ScanOperatorEnumerable} for the operator wrapper.
 *
 * @group Enumerators
 * @internal
 */
export class ScanEnumerator<TSource, TResult> extends TyneqEnumerator<TSource, TResult> {
    private readonly accumulator: (acc: TResult, item: TSource) => TResult;
    private current: TResult;

    /**
     * @param sourceEnumerator - Iterator to consume.
     * @param seed             - Initial accumulator value.
     * @param accumulator      - Function applied to the running total and each element.
     */
    public constructor(
        sourceEnumerator: IEnumerator<TSource>,
        seed: TResult,
        accumulator: (acc: TResult, item: TSource) => TResult
    ) {
        super(sourceEnumerator);
        this.current = seed;
        this.accumulator = accumulator;
    }

    protected override handleNext(): IteratorResult<TResult> {
        const { value, done } = this.sourceEnumerator.next();

        if (done) {
            return this.done();
        }

        this.current = this.accumulator(this.current, value);
        return this.yield(this.current);
    }
}
