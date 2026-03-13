import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerable, IEnumerator } from '../../types/core';
import { operator } from '../../extensibility/operatorDecorators';

/**
 * Enumerator that yields elements whose keys are not present in an excluded-keys sequence.
 *
 * @remarks
 * This method uses deferred execution. The source sequence is not enumerated until the returned sequence is iterated.
 *
 * Buffers the excluded keys into a `Set` on first iteration. Each unique key appears at most
 * once in the output (already-yielded keys are also added to the exclusion set).
 *
 * @typeParam TSource - The type of elements in the source sequence.
 * @typeParam TKey - The type of the comparison key.
 *
 * @group Enumerators
 * @internal
 */
@operator('exceptBy')
export class ExceptByEnumerator<TSource, TKey> extends TyneqEnumerator<TSource> {
    private readonly excludedKeys: Iterable<TKey>;
    private excludeSet = new Set<TKey>();
    private readonly keySelector: (item: TSource) => TKey;

    /**
     * @param sourceEnumerator - The upstream enumerator to wrap.
     * @param excludedKeys - Keys to exclude; buffered into a `Set` on first iteration.
     * @param keySelector - Extracts the comparison key from each source element.
     */
    public constructor(sourceEnumerator: IEnumerator<TSource>, excludedKeys: Iterable<TKey>, keySelector: (item: TSource) => TKey) {
        super(sourceEnumerator);
        this.excludedKeys = excludedKeys;
        this.keySelector = keySelector;
    }

    protected override initialize(): void {
        this.excludeSet = new Set<TKey>(this.excludedKeys);
    }

    protected override handleNext(): IteratorResult<TSource> {
        while (true) {
            const { done, value } = this.sourceEnumerator.next();
            if (done) {
                return this.done();
            }

            const key = this.keySelector(value);
            if (!this.excludeSet.has(key)) {
                this.excludeSet.add(key);
                return this.yield(value);
            }
        }
    }
}
