import { builtinOperator } from "../../extensions/builtinOperator";
import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";

/**
 * Enumerator that emits a running accumulation of elements.
 *
 * @remarks
 * Deferred. Source is not enumerated until iteration begins.
 *
 * For each source element, applies the accumulator to the running total and yields the updated
 * value. The seed is not yielded; only accumulated results are.
 *
 * ```text
 * source:  [ 1,  2,  3,  4,  5 ]   seed = 0, acc = (a, b) => a + b
 * yields:  [ 1,  3,  6, 10, 15 ]
 * ```
 *
 * @group Enumerators
 * @internal
 */
@builtinOperator({ name: "scan", kind: "streaming" })
export class ScanEnumerator<TSource, TResult> extends TyneqEnumerator<TSource, TResult> {
    private readonly accumulator: (acc: TResult, item: TSource) => TResult;
    private current: TResult;

    /**
     * @param sourceEnumerator - The upstream enumerator to consume.
     * @param seed - Initial accumulator value (not yielded).
     * @param accumulator - Combines the running total with each source element.
     */
    public constructor(
        sourceEnumerator: Enumerator<TSource>,
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