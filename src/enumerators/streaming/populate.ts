import { TyneqEnumerator } from '../../core/enumerators/TyneqEnumerator';
import { IEnumerator } from '../../types/core';
import { operator } from '../../extensibility/operatorDecorators';

/**
 * Enumerator implementation for replacing all source elements with a constant value.
 * 
 * @remarks
 * This enumerator maintains the cardinality of the source sequence while replacing
 * each element with the specified value. Streams values without buffering.
 * 
 * **Implementation**: For each source element, yields the constant value instead.
 * 
 * **Performance**: O(1) space (streaming). O(n) time when fully enumerated.
 * 
 * @typeParam TSource - The type of elements in the source sequence (ignored).
 * @typeParam TValue - The type of the replacement value.
 * 
 *
 * @group Enumerators
 * @internal
 */
@operator('populate')
export class PopulateEnumerator<TSource, TValue> extends TyneqEnumerator<TSource, TValue> {
    /** The value to yield for each source element. */
    private readonly value: TValue;

    /**
     * Creates a new populate enumerator.
     * 
     * @param sourceEnumerator - The source enumerator (determines cardinality only).
     * @param value - The value to yield for each source element.
     */
    public constructor(sourceEnumerator: IEnumerator<TSource>, value: TValue) {
        super(sourceEnumerator);
        this.value = value;
    }

    /**
     * Gets the constant value for each source element.
     * 
     * @returns Iterator result containing the constant value, or done when source exhausted.
     */
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