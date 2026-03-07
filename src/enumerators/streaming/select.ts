import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from "../../types/core";

/**
 * Enumerator implementation for projecting each element using a selector function.
 * 
 * @remarks
 * This enumerator applies a transformation function to each source element,
 * producing a new sequence of transformed values. Streams transformed elements
 * without buffering.
 * 
 * **Implementation**: Passes each source element through the selector function.
 * 
 * **Performance**: O(1) space (streaming). O(n) time when fully enumerated.
 * 
 * @typeParam T - The type of elements in the source sequence.
 * @typeParam U - The type of elements in the result sequence.
 * 
 * @see {@link SelectOperatorEnumerable} for the operator that uses this enumerator.
 *
 * @group Enumerators
 * @internal
 */
export class SelectEnumerator<T, U> extends TyneqEnumerator<T, U> {
    /** Function to transform each source element. */
    private readonly selector: (item: T) => U;

    /**
     * Creates a new select (map/projection) enumerator.
     * 
     * @param sourceEnumerator - The source enumerator.
     * @param selector - Function to transform each element.
     */
    public constructor(sourceEnumerator: IEnumerator<T>, selector: (item: T) => U) {
        super(sourceEnumerator);
        this.selector = selector;
    }

    /**
     * Gets the next transformed element.
     * 
     * @returns Iterator result containing the transformed element, or done when source exhausted.
     */
    protected override handleNext(): IteratorResult<U> {
        const next = this.sourceEnumerator.next();
        if (next.done) {
            return this.done();
        }

        const value = next.value;
        return this.yield(this.selector(value));
    }
}