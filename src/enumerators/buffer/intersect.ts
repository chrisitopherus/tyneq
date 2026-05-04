import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";

/**
 * Returns elements that are present in both the source and a second sequence.
 *
 * @remarks
 * Deferred. Source is fully buffered on the first iteration of the returned sequence.
 *
 * @see {@link TyneqSequence.intersect}
 * @group Operators
 * @category Buffering
 * @internal
 */
export class IntersectEnumerator<TSource> extends TyneqEnumerator<TSource> {
    private readonly otherValues: Iterable<TSource>;
    private intersectionValues = new Set<TSource>();
    private bufferedValues = new Set<TSource>();

    
    public constructor(sourceEnumerator: Enumerator<TSource>, otherValues: Iterable<TSource>) {
        super(sourceEnumerator);
        this.otherValues = otherValues;
    }

    protected override initialize(): void {
        this.intersectionValues = new Set<TSource>(this.otherValues);
    }

    protected override handleNext(): IteratorResult<TSource> {
        while (true) {
            const { done, value } = this.sourceEnumerator.next();
            if (done) {
                return this.done();
            }

            if (this.intersectionValues.has(value) && !this.bufferedValues.has(value)) {
                this.bufferedValues.add(value);
                return this.yield(value);
            }
        }
    }
}