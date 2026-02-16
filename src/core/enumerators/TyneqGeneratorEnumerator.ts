import { IEnumerator } from "../../types/core";

/**
 * Base class for enumerators that generate values without a source sequence.
 * 
 * @remarks
 * This abstract class provides lightweight infrastructure for implementing enumerators
 * that generate or compute elements independently, without consuming from a source
 * enumerable or enumerator.
 * 
 * Unlike {@link TyneqEnumerator} and {@link TyneqEnumerableEnumerator}, this class:
 * - Has no source dependency, eliminating disposal overhead
 * - Tracks only completion state, simplifying the implementation
 * - Is suitable for infinite or computed sequences (generators, ranges, etc.)
 * 
 * ## Key Semantics
 * 
 * - **Lifecycle**: Once `next()` returns `done: true`, all subsequent `next()` calls
 *   immediately return completion without further processing.
 * - **No Disposal**: Generator enumerators typically have no resources to release.
 *   The iterator protocol allows no-op or absent `return()` methods.
 * - **Pure Computation**: All elements are generated or computed on-demand during iteration,
 *   with no dependency on external state.
 * 
 * ## When to Use
 * 
 * Use this class when building operators or sources that:
 * 1. Generate values (e.g., `range()`, infinite sequences)
 * 2. Compute values without a source input
 * 3. Do not hold resources requiring cleanup
 * 
 * If you need to transform elements from a source enumerable, use
 * {@link TyneqEnumerableEnumerator}.
 * 
 * If you need to transform elements from a source enumerator, use
 * {@link TyneqEnumerator}.
 * 
 * @typeParam TOutput - The type of elements yielded by this generator.
 * 
 * @see {@link TyneqEnumerator} for working with source enumerators
 * @see {@link TyneqEnumerableEnumerator} for working with source enumerables
 */
export abstract class TyneqGeneratorEnumerator<TOutput> implements IEnumerator<TOutput> {
    private completed = false;

    /**
     * Advances the iterator to the next element.
     * 
     * @remarks
     * - Returns `{ done: false, value: TOutput }` when a value is yielded.
     * - Returns `{ done: true, value: undefined }` when iteration completes or after completion.
     * - Once completion is reached, all subsequent calls return immediately without processing.
     * 
     * @returns An iterator result containing the next generated value or completion state.
     */
    public next(): IteratorResult<TOutput> {
        if (this.completed) return this.complete();

        const result = this.handleNext();

        if (result.done) {
            this.completed = true;
        }
        
        return result;
    }

    /**
     * Yields a value to the caller.
     * 
     * @remarks
     * Helper method for subclasses to return a value continuation.
     * Used within `handleNext()` implementations to signal an element is available.
     * 
     * @param value - The element to yield.
     * @returns `{ done: false, value }`
     */
    protected yield(value: TOutput): IteratorResult<TOutput> {
        return { done: false, value };
    }

    /**
     * Signals completion of the sequence.
     * 
     * @remarks
     * Helper method indicating the end of generation.
     * Used to terminate iteration without producing a final value.
     * 
     * @returns `{ done: true, value: undefined }`
     */
    protected complete(): IteratorResult<TOutput> {
        return { done: true, value: undefined };
    }

    /**
     * Generates the next element in the sequence.
     * 
     * @remarks
     * Subclasses must implement this method to define generation logic.
     * This method is called by `next()` and should:
     * - Return `{ done: false, value }` to yield a generated element
     * - Return `{ done: true, value: undefined }` when generation is complete
     * 
     * Side effects (like tracking completion) are handled by `next()`, not this method.
     * 
     * @returns An iterator result containing either the next generated value or completion.
     */
    protected abstract handleNext(): IteratorResult<TOutput>;
}