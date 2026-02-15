import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

/**
 * Enumerator implementation that executes a side-effect action on each element without modifying the sequence.
 * 
 * @remarks
 * This enumerator operates in a streaming manner, invoking the provided action on each element as it passes
 * through. The action is called for its side effects only; the element itself is yielded unchanged. This is
 * useful for logging, debugging, or triggering external operations during enumeration.
 * 
 * The tap operation is transparent to the sequence pipeline - it doesn't filter, transform, or reorder elements.
 * It simply observes elements as they flow through, making it ideal for inspection without disrupting the
 * data flow.
 * 
 * Common use cases:
 * - Logging elements during pipeline execution
 * - Updating external state or metrics
 * - Debugging intermediate sequence states
 * - Triggering notifications or events
 * 
 * **Performance Characteristics:**
 * - Time Complexity: O(1) per element (plus action execution cost)
 * - Space Complexity: O(1) - no buffering required
 * - Streaming: Elements are processed one at a time without materializing the sequence
 * 
 * @typeParam TSource - The type of elements in the sequence
 */
export class TapEnumerator<TSource> extends TyneqEnumerator<TSource> {
    /**
     * The action to execute on each element as a side effect.
     * Called before yielding the element, does not affect the element's value.
     */
    private readonly action: (item: TSource) => void;
    
    /**
     * Initializes a new instance of the TapEnumerator class.
     * 
     * @param sourceEnumerator - The source enumerator to tap elements from
     * @param action - The action to execute on each element
     * @throws {Error} If action is null or undefined
     */
    public constructor(sourceEnumerator: IEnumerator<TSource>, action: (item: TSource) => void) {
        super(sourceEnumerator);
        ArgumentUtility.checkNotOptional(action, nameof({ action }));

        this.action = action;
    }

    /**
     * Advances the enumerator to the next element, executing the action as a side effect.
     * 
     * This method fetches the next element from the source, invokes the action with the element,
     * and then yields the element unchanged. The action is called before the yield, ensuring
     * side effects occur in sequence order during enumeration.
     * 
     * @returns An iterator result containing the next element (unchanged by the action),
     *          or done if the source is exhausted
     */
    protected override handleNext(): IteratorResult<TSource> {
        const next = this.sourceEnumerator.next();
        if (next.done) {
            return this.done();
        }

        this.action(next.value);
        return this.yield(next.value);
    }
}