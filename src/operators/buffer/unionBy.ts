import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from '../../types/core';
import { ArgumentUtility } from '../../utility/argumentUtility';
import { operator } from '../../extensibility/operatorDecorators';

/**
 * Enumerator that yields elements from both the source and a second sequence whose keys are unique.
 *
 * @remarks
 * Deferred. Source is not enumerated until iteration begins.
 *
 * Enumerates the source first, then the second sequence. Each unique key appears at most once
 * in the output. The first element encountered for a given key is yielded.
 *
 * @group Enumerators
 * @internal
 */
@operator<[otherValues: unknown, keySelector: unknown]>('unionBy', 'buffer', (otherValues, keySelector) => {
    ArgumentUtility.checkNotOptional({ otherValues });
    ArgumentUtility.checkIterable({ otherValues });
    ArgumentUtility.checkNotOptional({ keySelector });
})
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
