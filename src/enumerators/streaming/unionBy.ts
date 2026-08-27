import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";

/**
 * Returns the set union of the source and a second sequence, eliminating duplicates by key.
 *
 * @remarks
 * Deferred. Streams the source, then streams `otherValues`, holding a seen-key `Set` that
 * grows to at most the number of distinct keys yielded so far - neither sequence is read fully
 * eagerly.
 *
 * @see {@link TyneqSequence.unionBy}
 * @group Operators
 * @category Streaming
 * @internal
 */
export class UnionByEnumerator<TSource, TKey> extends TyneqEnumerator<TSource> {
    private readonly otherValues: Iterable<TSource>;
    private readonly bufferedKeys = new Set<TKey>();
    private readonly keySelector: (item: TSource) => TKey;
    private currentEnumerator: Enumerator<TSource>;
    private isSourceDone = false;

    public constructor(sourceEnumerator: Enumerator<TSource>, otherValues: Iterable<TSource>, keySelector: (item: TSource) => TKey) {
        super(sourceEnumerator);
        this.otherValues = otherValues;
        this.currentEnumerator = this.sourceEnumerator;
        this.keySelector = keySelector;
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

            const key = this.keySelector(value);
            if (!this.bufferedKeys.has(key)) {
                this.bufferedKeys.add(key);
                return this.yield(value);
            }
        }
    }
}