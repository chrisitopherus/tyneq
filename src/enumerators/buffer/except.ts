import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from '../../types/core';
import { operator } from '../../extensibility/operatorDecorators';
import { ArgumentUtility } from '../../utility/argumentUtility';

/**
 * Enumerator that yields elements from the source that are not present in an excluded-values sequence.
 *
 * @remarks
 * This method uses deferred execution. The source sequence is not enumerated until the returned sequence is iterated.
 *
 * Buffers the excluded sequence into a `Set` on first iteration. Each source value appears at
 * most once in the output (already-yielded values are also added to the exclusion set).
 *
 * @typeParam TSource - The type of elements in the sequences.
 *
 * @group Enumerators
 * @internal
 */
@operator<[excludedValues: unknown]>('except', (excludedValues) => {
    ArgumentUtility.checkNotOptional({ excludedValues });
})
export class ExceptEnumerator<TSource> extends TyneqEnumerator<TSource> {
    private readonly excludedValues: Iterable<TSource>;
    private excludeSet = new Set<TSource>();

    /**
     * @param sourceEnumerator - The upstream enumerator to wrap.
     * @param excludedValues - Values to exclude from the result; buffered into a `Set` on first iteration.
     */
    public constructor(sourceEnumerator: IEnumerator<TSource>, excludedValues: Iterable<TSource>) {
        super(sourceEnumerator);
        this.excludedValues = excludedValues;
    }

    protected override initialize(): void {
        this.excludeSet = new Set<TSource>(this.excludedValues);
    }

    protected override handleNext(): IteratorResult<TSource> {
        while (true) {
            const { done, value } = this.sourceEnumerator.next();
            if (done) {
                return this.done();
            }

            if (!this.excludeSet.has(value)) {
                this.excludeSet.add(value);
                return this.yield(value);
            }
        }
    }
}
