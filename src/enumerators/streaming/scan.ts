import { builtinOperator } from "../../plugin/builtinOperator";
import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";

/**
 * Applies an accumulator function and yields the running result after each element.
 *
 * @remarks
 * Deferred. Source is not enumerated until the returned sequence is iterated.
 *
 * @see {@link TyneqSequence.scan}
 * @group Operators
 * @category Streaming
 * @internal
 */
@builtinOperator({ name: "scan", kind: "streaming" })
export class ScanEnumerator<TSource, TResult> extends TyneqEnumerator<TSource, TResult> {
    private readonly accumulator: (acc: TResult, item: TSource) => TResult;
    private current: TResult;

    
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