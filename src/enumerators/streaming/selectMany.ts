import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerable, IEnumerator } from "../../types/core";
import { Nullable } from '../../types/utility';

/**
 * Enumerator implementation for projecting and flattening nested sequences.
 * 
 * @remarks
 * This enumerator applies a selector to each source element to obtain a nested sequence,
 * then flattens all nested sequences into a single flat sequence (flatMap). Maintains
 * an inner enumerator for the current nested sequence and automatically advances to
 * the next nested sequence when exhausted.
 * 
 * **Implementation**: Maintains inner enumerator, switches to next when exhausted.
 * 
 * **Performance**: O(1) space (streaming, excluding nested sequence). O(n + m) time
 * where n is source length and m is total length of all nested sequences.
 * 
 * @typeParam T - The type of elements in the source sequence.
 * @typeParam U - The type of elements in the flattened result sequence.
 * 
 * @see {@link SelectManyOperatorEnumerable} for the operator that uses this enumerator.
 */
export class SelectManyEnumerator<T, U> extends TyneqEnumerator<T, U> {
    /** Function to project each element to a nested sequence. */
    private readonly selector: (item: T) => Iterable<U>;
    /** Current nested sequence enumerator (null when between nested sequences). */
    private innerEnumerator: Nullable<IEnumerator<U>> = null;

    /**
     * Creates a new selectMany (flatMap) enumerator.
     * 
     * @param sourceEnumerator - The source enumerator.
     * @param selector - Function to project each element to a nested sequence.
     */
    public constructor(sourceEnumerator: IEnumerator<T>, selector: (item: T) => Iterable<U>) {
        super(sourceEnumerator);
        this.selector = selector;
    }

    /**
     * Gets the next element from the current or next nested sequence.
     * Automatically advances through nested sequences.
     * 
     * @returns Iterator result containing the next flattened element, or done when all exhausted.
     */
    protected override handleNext(): IteratorResult<U> {
        while (true) {
            if (this.innerEnumerator !== null) {
                const innerNext = this.innerEnumerator.next();
                if (!innerNext.done) {
                    return this.yield(innerNext.value);
                }

                this.innerEnumerator = null;
            }

            const sourceNext = this.sourceEnumerator.next();
            if (sourceNext.done) {
                return this.done();
            }

            this.innerEnumerator = this.selector(sourceNext.value)[Symbol.iterator]();
        }
    }
}