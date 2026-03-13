import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerable, IEnumerator } from '../../types/core';
import { operator } from '../../extensibility/operatorDecorators';

/**
 * Enumerator that yields elements present in both the source and another sequence.
 *
 * @remarks
 * This method uses deferred execution. The source sequence is not enumerated until the returned sequence is iterated.
 *
 * Buffers the other sequence into a `Set` on first iteration. Each value appears at most once
 * in the output.
 *
 * @typeParam TSource - The type of elements in the sequences.
 *
 * @group Enumerators
 * @internal
 */
@operator('intersect')
export class IntersectEnumerator<TSource> extends TyneqEnumerator<TSource> {
    private readonly otherValues: Iterable<TSource>;
    private intersectionValues = new Set<TSource>();
    private bufferedValues = new Set<TSource>();

    /**
     * @param sourceEnumerator - The upstream enumerator to wrap.
     * @param otherValues - The second sequence; buffered into a `Set` on first iteration.
     */
    public constructor(sourceEnumerator: IEnumerator<TSource>, otherValues: Iterable<TSource>) {
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
