import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";
import { ArgumentUtility } from "../../utility/ArgumentUtility";

/**
 * Splits the source sequence into sub-arrays at each element matching a predicate.
 *
 * @remarks
 * Deferred. Source is not enumerated until the returned sequence is iterated.
 *
 * @see {@link TyneqSequence.split}
 * @group Operators
 * @category Streaming
 * @internal
 */
export class SplitEnumerator<TSource> extends TyneqEnumerator<TSource, TSource[]> {
    private readonly splitOn: (item: TSource) => boolean;

    
    public constructor(sourceEnumerator: Enumerator<TSource>, splitOn: (item: TSource) => boolean) {
        super(sourceEnumerator);
        this.splitOn = splitOn;
    }

    protected override handleNext(): IteratorResult<TSource[]> {
        const currentSplit: TSource[] = [];

        while (true) {
            const { value, done } = this.sourceEnumerator.next();
            if (done) {
                if (currentSplit.length > 0) {
                    return this.doneWithYield(currentSplit);
                }

                return this.done();
            }

            if (this.splitOn(value)) {
                if (currentSplit.length > 0) {
                    return this.yield(currentSplit);
                }
            } else {
                currentSplit.push(value);
            }
        }
    }
}