import { TyneqEnumerator } from '../../core/enumerators/TyneqEnumerator';
import { IEnumerator } from '../../types/core';
import { operator } from '../../extensibility/operatorDecorators';

/**
 * Enumerator that replaces every source element with a constant value.
 *
 * @remarks
 * This method uses deferred execution. The source sequence is not enumerated until the returned sequence is iterated.
 *
 * Preserves the cardinality of the source sequence; yields `value` once per source element.
 *
 * @typeParam TSource - The type of elements in the source sequence (consumed but not yielded).
 * @typeParam TValue - The type of the replacement value.
 *
 * @group Enumerators
 * @internal
 */
@operator('populate')
export class PopulateEnumerator<TSource, TValue> extends TyneqEnumerator<TSource, TValue> {
    private readonly value: TValue;

    /**
     * @param sourceEnumerator - The upstream enumerator (drives cardinality only).
     * @param value - The value to yield for each source element.
     */
    public constructor(sourceEnumerator: IEnumerator<TSource>, value: TValue) {
        super(sourceEnumerator);
        this.value = value;
    }

    protected override handleNext(): IteratorResult<TValue> {
        while (true) {
            const { done } = this.sourceEnumerator.next();
            if (done) {
                return this.done();
            }

            return this.yield(this.value);
        }
    }
}
