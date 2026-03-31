import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";

/**
 * Returns elements from the source sequence that are not present in a second sequence.
 *
 * @remarks
 * Deferred. Source is fully buffered on the first iteration of the returned sequence.
 *
 * @see {@link TyneqSequence.except}
 * @group Operators
 * @category Buffering
 * @internal
 */
export class ExceptEnumerator<TSource> extends TyneqEnumerator<TSource> {
    private readonly excludedValues: Iterable<TSource>;
    private excludeSet = new Set<TSource>();

    
    public constructor(sourceEnumerator: Enumerator<TSource>, excludedValues: Iterable<TSource>) {
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