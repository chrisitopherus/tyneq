import { IEnumerable, IEnumerator } from '../../types/core';
import { ArgumentUtility } from '../../utility/argumentUtility';
import { nameof } from '../../utility/nameof';

/**
 * Base class for enumerators that transform elements from an enumerable sequence.
 * 
 * @remarks
 * This abstract class provides infrastructure for implementing enumerators that consume
 * from an `IEnumerable<TInput>` source and yield transformed `TOutput` values.
 * 
 * ## Key Semantics
 * 
 * - **Lifecycle**: Once `next()` returns `done: true`, all subsequent `next()` calls
 *   immediately return completion without further processing.
 * - **Disposal**: Calls to `return()` trigger cleanup via `dispose()`,
 *   stopping iteration and releasing resources.
 * - **Validation**: The source enumerable is validated in the constructor; an exception
 *   is thrown if null or undefined (via {@link ArgumentUtility.checkNotOptional}).
 * - **State Management**: Tracks both `completed` and `sourceDisposed` to prevent
 *   redundant cleanup and ensure idempotent behavior.
 * 
 * ## When to Use
 * 
 * Use this class when building operators that:
 * 1. Accept a source enumerable and obtain a fresh enumerator on each iteration
 * 2. Transform or filter elements from that source
 * 3. May need to dispose of resources when iteration is cut short
 * 
 * If working directly with an enumerator (not an enumerable), use {@link TyneqEnumerator}.
 * If generating values without a source dependency, use {@link TyneqGeneratorEnumerator}.
 * 
 * @typeParam TInput - The type of elements in the source enumerable.
 * @typeParam TOutput - The type of elements yielded by this enumerator (may equal TInput).
 * 
 * @see {@link TyneqEnumerator} for working with enumerators directly
 * @see {@link TyneqGeneratorEnumerator} for generation without source dependency
 */
export abstract class TyneqEnumerableEnumerator<TInput, TOutput = TInput> implements IEnumerator<TOutput> {
    private sourceDisposed = false;
    private completed = false;

    /**
     * The source enumerable from which elements are obtained.
     * Each call to `getEnumerator()` on this source provides a fresh iterator.
     */
    protected readonly sourceEnumerable: IEnumerable<TInput>;

    /**
     * Constructs a new enumerator for the specified enumerable source.
     * 
     * @param sourceEnumerable - The enumerable sequence to iterate over.
     *                           Must not be null or undefined.
     * 
     * @throws {@link ArgumentNullError} if `sourceEnumerable` is null.
     * @throws {@link ArgumentError} if `sourceEnumerable` is undefined.
     */
    public constructor(sourceEnumerable: IEnumerable<TInput>) {
        ArgumentUtility.checkNotOptional(sourceEnumerable, nameof({ sourceEnumerable }));

        this.sourceEnumerable = sourceEnumerable;
    }

    /**
     * Advances the iterator to the next element.
     * 
     * @remarks
     * - Returns `{ done: false, value: TOutput }` when a value is yielded.
     * - Returns `{ done: true, value: undefined }` when iteration completes or after completion.
     * - Once completion is reached, all subsequent calls return immediately without processing.
     * 
     * @returns An iterator result containing the next value or completion state.
     */
    public next(): IteratorResult<TOutput> {
        if (this.completed) return this.done();

        const result = this.handleNext();

        if (result.done) {
            this.completed = true;
            return this.done();
        }

        return result;
    }

    /**
     * Terminates iteration and releases resources.
     * 
     * @remarks
     * This method is called when iteration is cut short (e.g., break from a for-of loop).
     * It triggers cleanup through {@link dispose}, marking the enumerator as completed.
     * Cannot be undone; subsequent calls to `next()` will return completion.
     * 
     * @param value - Optional value associated with the early termination.
     * @returns `{ done: true, value: undefined }`
     */
    public return(value?: unknown): IteratorResult<TOutput> {
        this.dispose(value);
        this.completed = true;
        return this.done();
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
     * Signals completion of iteration.
     * 
     * @remarks
     * Helper method indicating the end of the sequence.
     * Used to terminate iteration without producing a final value.
     * 
     * @returns `{ done: true, value: undefined }`
     */
    protected done(): IteratorResult<TOutput> {
        return { done: true, value: undefined };
    }

    /**
     * Yields a final value and completes iteration.
     * 
     * @remarks
     * Convenience method for the pattern of returning a value and then ending.
     * After calling this, subsequent `next()` calls will return completion.
     * 
     * @param value - The final element to yield.
     * @returns `{ done: false, value }`
     */
    protected doneWithYield(value: TOutput): IteratorResult<TOutput> {
        this.completed = true;
        return this.yield(value);
    }

    /**
     * Terminates iteration early and triggers resource cleanup.
     * 
     * @remarks
     * Used when subclass logic determines early completion is necessary
     * (e.g., a predicate is satisfied and no further elements are needed).
     * Automatically disposes resources via {@link dispose}.
     * 
     * @param reason - Optional reason or context for early completion.
     * @returns `{ done: true, value: undefined }`
     */
    protected earlyComplete(reason?: unknown): IteratorResult<TOutput> {
        this.dispose(reason);
        this.completed = true;
        return this.done();
    }

    /**
     * Releases resources associated with this enumerator.
     * 
     * @remarks
     * Called during early termination or normal completion.
     * Invokes {@link disposeSource} and {@link disposeAdditional} in sequence.
     * Safe to call multiple times; only the first call performs cleanup.
     * 
     * @param value - Optional context passed through cleanup phases.
     */
    protected dispose(value?: unknown): void {
        this.disposeSource();
        this.disposeAdditional(value);
    }

    /**
     * Safely disposes the source enumerable.
     * 
     * @remarks
     * For `IEnumerable` sources, disposal is typically a no-op since enumerables
     * do not hold persistent resources. Overrides may perform cleanup if needed.
     * Idempotent: calling multiple times executes cleanup once via the `sourceDisposed` flag.
     */
    protected disposeSource(): void {
        if (this.sourceDisposed) return;
        this.sourceDisposed = true;

        // no need for disposal
    }

    /**
     * Disposes additional resources specific to this enumerator.
     * 
     * @remarks
     * Override this method in subclasses to release custom resources (buffers, timers, etc.).
     * Called after {@link disposeSource} during cleanup.
     * Default implementation does nothing.
     * 
     * @param value - Optional context from the disposal trigger.
     */
    protected disposeAdditional(value?: unknown): void { }

    /**
     * Retrieves the next element from the source and produces the output.
     * 
     * @remarks
     * Subclasses must implement this method to define transformation/filtering logic.
     * This method is called by `next()` and should:
     * - Return `{ done: false, value }` to yield an element
     * - Return `{ done: true, value: undefined }` when source is exhausted
     * 
     * Side effects (like disposal) are handled by `next()`, not this method.
     * 
     * @returns An iterator result containing either the next transformed value or completion.
     */
    protected abstract handleNext(): IteratorResult<TOutput>;
}