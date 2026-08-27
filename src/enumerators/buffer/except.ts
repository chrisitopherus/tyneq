import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";

/**
 * Returns elements from the source sequence that are not present in a second sequence.
 *
 * @remarks
 * Deferred. Buffers `excludedValues` into a `Set` on the first iteration; the source itself
 * streams - each source element is pulled and checked one at a time, never fully materialized.
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