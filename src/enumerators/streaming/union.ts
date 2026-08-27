import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";

/**
 * Returns the set union of the source and a second sequence, eliminating duplicates.
 *
 * @remarks
 * Deferred. Streams the source, then streams `otherValues`, holding a seen-value `Set` that
 * grows to at most the number of distinct elements yielded so far - neither sequence is read
 * fully eagerly.
 *
 * @see {@link TyneqSequence.union}
 * @group Operators
 * @category Streaming
 * @internal
 */
export class UnionEnumerator<TSource> extends TyneqEnumerator<TSource> {
    private readonly otherValues: Iterable<TSource>;
    private bufferedValues = new Set<TSource>();
    private currentEnumerator: Enumerator<TSource>;
    private isSourceDone = false;

    
    public constructor(sourceEnumerator: Enumerator<TSource>, otherValues: Iterable<TSource>) {
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