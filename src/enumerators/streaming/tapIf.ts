import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { operator } from '../../extensibility/operatorDecorators';

/**
 * Enumerator implementation that conditionally executes a side-effect action on each element based on a predicate.
 * 
 * @remarks
 * This enumerator operates in a streaming manner, evaluating a predicate for each element to determine
 * whether to invoke the action. The action is called only when the predicate returns true. Regardless of
 * the predicate result, all elements are yielded unchanged, maintaining the original sequence.
 * 
 * The predicate accepts no arguments - it represents a global condition rather than element-specific logic.
 * This design allows for conditional tapping based on external state, configuration flags, or runtime
 * conditions that apply uniformly to all elements.
 * 
 * This differs from a filter operation: the predicate controls action execution, not element inclusion.
 * All elements pass through the enumerator; only the side effect is conditional.
 * 
 * Common use cases:
 * - Conditional logging based on debug flags
 * - Metrics collection when performance monitoring is enabled
 * - Element inspection during specific application states
 * 
 * **Performance Characteristics:**
 * - Time Complexity: O(1) per element (plus predicate and action execution cost when predicate is true)
 * - Space Complexity: O(1) - no buffering required
 * - Streaming: Elements are processed one at a time without materializing the sequence
 * 
 * @typeParam TSource - The type of elements in the sequence
 *
 * @group Enumerators
 * @internal
 */
@operator('tapIf', (action: any, predicate: any) => {
    ArgumentUtility.checkNotOptional({ action });
    ArgumentUtility.checkNotOptional({ predicate });
})
export class TapIfEnumerator<TSource> extends TyneqEnumerator<TSource> {
    /**
     * The action to execute on each element when the predicate returns true.
     * Called conditionally based on predicate evaluation, does not affect the element's value.
     */
    private readonly action: (item: TSource) => void;

    /**
     * The predicate function that determines whether to execute the action.
     * Accepts no arguments - represents a global condition evaluated for each element.
     */
    private readonly predicate: () => boolean;

    /**
     * Initializes a new instance of the TapIfEnumerator class.
     * 
     * @param sourceEnumerator - The source enumerator to tap elements from
     * @param action - The action to execute on each element when the predicate returns true
     * @param predicate - The function that determines whether to execute the action (accepts no arguments)
     * @throws {Error} If action or predicate is null or undefined
     */
    public constructor(sourceEnumerator: IEnumerator<TSource>, action: (item: TSource) => void, predicate: () => boolean) {
        super(sourceEnumerator);
        this.action = action;
        this.predicate = predicate;
    }

    /**
     * Advances the enumerator to the next element, conditionally executing the action.
     * 
     * This method fetches the next element from the source, evaluates the predicate, and invokes
     * the action only if the predicate returns true. The element is then yielded unchanged regardless
     * of the predicate result. This ensures the sequence integrity while allowing conditional side effects.
     * 
     * @returns An iterator result containing the next element (unchanged), or done if the source is exhausted
     */
    protected override handleNext(): IteratorResult<TSource> {
        const next = this.sourceEnumerator.next();
        if (next.done) {
            return this.done();
        }

        if (this.predicate()) {
            this.action(next.value);
        }

        return this.yield(next.value);
    }
}