import { TyneqSourceEnumerator } from "../../core/enumerators/TyneqSourceEnumerator";
import { IEnumerator } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { operator } from "../../extensibility/operator";

/**
 * Enumerator that splits a sequence into sub-arrays at delimiter elements.
 *
 * @remarks
 * Deferred. Source is not enumerated until iteration begins.
 *
 * Elements for which the predicate returns `true` are treated as delimiters and are excluded from output.
 * Consecutive delimiters do not produce empty arrays. A trailing delimiter produces no extra empty array.
 * The final partial group is yielded when the source is exhausted.
 *
 * @group Enumerators
 * @internal
 */
@operator<[splitOn: unknown]>("split", (splitOn) => {
    ArgumentUtility.checkNotOptional({ splitOn });
})
export class SplitEnumerator<TSource> extends TyneqSourceEnumerator<TSource, TSource[]> {
    private readonly splitOn: (item: TSource) => boolean;

    /**
     * @param sourceEnumerator - The upstream enumerator to wrap.
     * @param splitOn - Identifies delimiter elements; matching elements are consumed but not yielded.
     */
    public constructor(sourceEnumerator: IEnumerator<TSource>, splitOn: (item: TSource) => boolean) {
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
