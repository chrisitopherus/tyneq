import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { operator } from "../../extensibility/operator";

/**
 * Enumerator that yields unique elements from both the source and a second sequence.
 *
 * @remarks
 * Deferred. Source is not enumerated until iteration begins.
 *
 * Enumerates the source first, then the second sequence. Each value appears at most once in
 * the output. Uniqueness is tracked in a Set accumulated across both sequences.
 *
 * @group Enumerators
 * @internal
 */
@operator<[otherValues: unknown]>("union", "buffer", (otherValues) => {
    ArgumentUtility.checkNotOptional({ otherValues });
    ArgumentUtility.checkIterable({ otherValues });
})
export class UnionEnumerator<TSource> extends TyneqEnumerator<TSource> {
    private readonly otherValues: Iterable<TSource>;
    private bufferedValues = new Set<TSource>();
    private currentEnumerator: IEnumerator<TSource>;
    private isSourceDone = false;

    /**
     * @param sourceEnumerator - The upstream enumerator to wrap.
     * @param otherValues - The second sequence to union with.
     */
    public constructor(sourceEnumerator: IEnumerator<TSource>, otherValues: Iterable<TSource>) {
        super(sourceEnumerator);
        this.otherValues = otherValues;
        this.currentEnumerator = this.sourceEnumerator;
    }

    protected override handleNext(): IteratorResult<TSource> {
        while (true) {
            const { done, value } = this.currentEnumerator.next();
            if (done) {
                if (this.isSourceDone) {
                    return this.done();
                }

                this.isSourceDone = true;
                this.currentEnumerator = this.otherValues[Symbol.iterator]();
                continue;
            }

            if (!this.bufferedValues.has(value)) {
                this.bufferedValues.add(value);
                return this.yield(value);
            }
        }
    }
}
