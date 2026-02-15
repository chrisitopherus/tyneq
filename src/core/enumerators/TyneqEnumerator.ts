import { TyneqGeneratorEnumerator } from './TyneqGeneratorEnumerator';
import { TyneqEnumerableEnumerator } from './TyneqEnumerableEnumerator';
import { IEnumerator } from '../../types/core';
import { ArgumentUtility } from '../../utility/argumentUtility';
import { EnumeratorUtility } from '../../utility/EnumeratorUtility';
import { nameof } from '../../utility/nameof';

/**
 * Base class for enumerators that transform elements from a source enumerator.
 * 
 * @remarks
 * This abstract class provides infrastructure for implementing enumerators that consume
 * from an `IEnumerator<TInput>` source and yield transformed `TOutput` values.
 * 
 * Unlike {@link TyneqEnumerableEnumerator}, this class works directly with enumerators,
 * making it suitable for streaming operators where the source enumerator is passed through
 * the entire chain (e.g., from one operator to the next).
 * 
 * ## Key Semantics
 * 
 * - **Lifecycle**: Once `next()` returns `done: true`, all subsequent `next()` calls
 *   immediately return completion without further processing.
 * - **Disposal**: When iteration is cut short, `return()` triggers cleanup via `dispose()`,
 *   which safely disposes the source enumerator via {@link EnumeratorUtility.tryDispose}.
 * - **Validation**: The source enumerator is validated in the constructor; an exception
 *   is thrown if null or undefined (via {@link ArgumentUtility.checkNotOptional}).
 * - **Resource Management**: The source enumerator is properly cleaned up through
 *   `disposeSource()`, which calls the enumerator's `return()` method if present.
 * 
 * ## When to Use
 * 
 * Use this class when building operators that:
 * 1. Accept a source enumerator directly
 * 2. Form part of a streaming chain where enumerators are passed through operators
 * 3. Need to transform or filter elements while properly maintaining enumerator lifecycle
 * 
 * If working with an enumerable (creating fresh enumerators per iteration),
 * use {@link TyneqEnumerableEnumerator} instead.
 * 
 * If generating values without a source dependency, use {@link TyneqGeneratorEnumerator}.
 * 
 * @typeParam TInput - The type of elements produced by the source enumerator.
 * @typeParam TOutput - The type of elements yielded by this enumerator (may equal TInput).
 * 
 * @see {@link TyneqEnumerableEnumerator} for working with enumerables
 * @see {@link TyneqGeneratorEnumerator} for generation without source dependency
 * @see {@link EnumeratorUtility.tryDispose} for the safe disposal mechanism
 */
export abstract class TyneqEnumerator<TInput, TOutput = TInput> implements IEnumerator<TOutput> {
    private sourceDisposed = false;
    private completed = false;

    /**
     * The source enumerator from which elements are obtained.
     * This enumerator must be disposed when iteration ends or is cut short.
     */
    protected readonly sourceEnumerator: IEnumerator<TInput>;

    /**
     * Constructs a new enumerator that wraps a source enumerator.
     * 
     * @param sourceEnumerator - The enumerator to transform elements from.
     *                           Must not be null or undefined.
     * 
     * @throws {@link ArgumentNullError} if `sourceEnumerator` is null.
     * @throws {@link ArgumentError} if `sourceEnumerator` is undefined.
     */
    public constructor(sourceEnumerator: IEnumerator<TInput>) {
        ArgumentUtility.checkNotOptional(sourceEnumerator, nameof({ sourceEnumerator }));

        this.sourceEnumerator = sourceEnumerator;
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
     * The source enumerator is safely disposed via {@link EnumeratorUtility.tryDispose}.
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
     * Automatically disposes resources and the source enumerator via {@link dispose}.
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
     * Safely disposes the source enumerator.
     * 
     * @remarks
     * Calls {@link EnumeratorUtility.tryDispose} on the source enumerator, which:
     * - Invokes the enumerator's `return()` method if present
     * - Catches and suppresses any disposal errors
     * - Is idempotent: calling multiple times via the `sourceDisposed` flag prevents redundant cleanup
     * 
     * This ensures that resources held by the source are released even if the
     * source's `return()` method throws an exception.
     */
    protected disposeSource(): void {
        if (this.sourceDisposed) return;

        this.sourceDisposed = true;
        EnumeratorUtility.tryDispose(this.sourceEnumerator);
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
