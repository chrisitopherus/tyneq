import { IEnumerator } from '../../types/core';
import { EnumeratorUtility } from '../../utility/EnumeratorUtility';

export abstract class TyneqBaseEnumerator<TInput, TOutput = TInput> implements IEnumerator<TOutput> {
    protected sourceDisposed = false;
    protected completed = false;

    public constructor() { }

    public next(): IteratorResult<TOutput> {
        if (this.completed) return this.done();

        const result = this.handleNext();

        if (result.done) {
            this.completed = true;
            return this.done();
        }

        return result;
    }

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
     * 
     * @param value - Optional context passed through cleanup phases.
     */
    protected abstract dispose(value?: unknown): void;

    /**
     * Safely disposes the source enumerator.
     * 
     * @remarks
     * 
     * This ensures that resources held by the source are released even if the
     * source's `return()` method throws an exception.
     */
    protected abstract disposeSource(): void;

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
