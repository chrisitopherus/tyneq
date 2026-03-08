import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from "../../types/core";
import { EnumeratorUtility } from "../../utility/EnumeratorUtility";
import { operator } from '../../extensibility/operatorDecorators';

/**
 * Enumerator implementation that combines two sequences in a pairwise manner using a selector function.
 * 
 * @remarks
 * This enumerator operates in a streaming manner, pulling one element from each sequence simultaneously
 * and applying the selector function to produce a result element. The enumeration continues until either
 * sequence is exhausted.
 * 
 * Key behavior characteristics:
 * - Terminates when the shorter sequence ends (zip semantics)
 * - When the source (first) sequence ends, properly disposes the other enumerator
 * - When the other (second) sequence ends first, signals early completion to stop source enumeration
 * - Elements are processed pairwise without buffering either sequence
 * 
 * The selector function provides flexibility to combine the paired elements in any desired manner,
 * from simple tuple creation to complex transformations or aggregations.
 * 
 * **Resource Management:**
 * The enumerator ensures proper disposal of the secondary enumerator via `disposeAdditional()`,
 * preventing resource leaks when the zip operation completes.
 * 
 * **Performance Characteristics:**
 * - Time Complexity: O(1) per pair (plus selector execution cost)
 * - Space Complexity: O(1) - no buffering required
 * - Streaming: Processes one pair at a time without materializing either sequence
 * - Early Termination: Stops both sequences as soon as either is exhausted
 * 
 * @typeParam T - The type of elements in the first (source) sequence
 * @typeParam U - The type of elements in the second sequence
 * @typeParam V - The type of elements produced by combining pairs
 *
 * @group Enumerators
 * @internal
 */
@operator('zip')
export class ZipEnumerator<T, U, V> extends TyneqEnumerator<T, V> {
    /**
     * The secondary enumerator providing the second element of each pair.
     * Disposed when enumeration completes via `disposeAdditional()`.
     */
    private readonly otherEnumerator: IEnumerator<U>;
    
    /**
     * The function that combines paired elements from both sequences into the output type.
     */
    private readonly selector: (first: T, second: U) => V;

    /**
     * Initializes a new instance of the ZipEnumerator class.
     * 
     * @param sourceEnumerator - The first sequence to zip
     * @param otherEnumerator - The second sequence to zip
     * @param selector - The function that combines paired elements from both sequences
     */
    public constructor(sourceEnumerator: IEnumerator<T>, other: Iterable<U>, selector: (first: T, second: U) => V) {
        super(sourceEnumerator);
        this.otherEnumerator = other[Symbol.iterator]();
        this.selector = selector;
    }

    /**
     * Advances the enumerator to the next paired element.
     * 
     * This method fetches one element from each sequence:
     * 1. If the source (first) sequence is exhausted, disposes the other enumerator and completes
     * 2. If the other (second) sequence is exhausted, signals early completion to stop source enumeration
     * 3. If both have elements, applies the selector to the pair and yields the result
     * 
     * The early completion mechanism ensures efficient termination when the shorter sequence ends,
     * avoiding unnecessary processing of the longer sequence.
     * 
     * @returns An iterator result containing the selector result for the next pair,
     *          or done if either sequence is exhausted
     */
    protected override handleNext(): IteratorResult<V> {
        const first = this.sourceEnumerator.next();
        if (first.done) {
            this.disposeAdditional();
            return this.done();
        }

        const second = this.otherEnumerator.next();
        if (second.done) {
            return this.earlyComplete();
        }

        return this.yield(this.selector(first.value, second.value));
    }

    /**
     * Disposes additional resources beyond the source enumerator.
     * 
     * This override ensures the secondary enumerator is properly disposed when enumeration completes,
     * preventing resource leaks from undisposed enumerators.
     */
    protected override disposeAdditional(): void {
        EnumeratorUtility.tryDispose(this.otherEnumerator);
    }
}