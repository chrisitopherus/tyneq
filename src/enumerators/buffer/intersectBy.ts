import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";

/**
 * Returns elements whose keys appear in both the source and a second key sequence.
 *
 * @remarks
 * Deferred. Source is fully buffered on the first iteration of the returned sequence.
 *
 * @see {@link TyneqSequence.intersectBy}
 * @group Operators
 * @category Buffering
 * @internal
 */
export class IntersectByEnumerator<TSource, TKey> extends TyneqEnumerator<TSource> {
    private readonly otherValues: Iterable<TKey>;
    private readonly keySelector: (item: TSource) => TKey;
    private intersectionKeys = new Set<TKey>();
    private bufferedKeys = new Set<TKey>();

    public constructor(sourceEnumerator: Enumerator<TSource>, otherValues: Iterable<TKey>, keySelector: (item: TSource) => TKey) {
        super(sourceEnumerator);
        this.otherValues = otherValues;
        this.keySelector = keySelector;
    }

    protected override initialize(): void {
        this.intersectionKeys = new Set<TKey>(this.otherValues);
    }

    protected override handleNext(): IteratorResult<TSource> {
        while (true) {
            const { done, value } = this.sourceEnumerator.next();
            if (done) {
                return this.done();
            }

            const key = this.keySelector(value);

            if (this.intersectionKeys.has(key) && !this.bufferedKeys.has(key)) {
                this.bufferedKeys.add(key);
                return this.yield(value);
            }
        }
    }
}