import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from '../../types/core';
import { operator } from '../../extensibility/operatorDecorators';

/**
 * Enumerator that yields elements from both the source and a second sequence whose keys are unique.
 *
 * @remarks
 * This method uses deferred execution. The source sequence is not enumerated until the returned sequence is iterated.
 *
 * Enumerates the source first, then the second sequence. Each unique key appears at most once
 * in the output. The first element encountered for a given key is yielded.
 *
 * @typeParam TSource - The type of elements in the sequences.
 * @typeParam TKey - The type of the comparison key.
 *
 * @group Enumerators
 * @internal
 */
@operator('unionBy')
export class UnionByEnumerator<TSource, TKey> extends TyneqEnumerator<TSource> {
    private readonly otherValues: Iterable<TSource>;
    private readonly bufferedKeys = new Set<TKey>();
    private readonly keySelector: (item: TSource) => TKey;
    private currentEnumerator: IEnumerator<TSource>;
    private isSourceDone = false;

    /**
     * @param sourceEnumerator - The upstream enumerator to wrap.
     * @param otherValues - The second sequence to union with.
     * @param keySelector - Extracts the comparison key from each element.
     */
    public constructor(sourceEnumerator: IEnumerator<TSource>, otherValues: Iterable<TSource>, keySelector: (item: TSource) => TKey) {
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
