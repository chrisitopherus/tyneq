import { IEnumerator } from '../../types/core';
import { EnumeratorUtility } from '../../utility/EnumeratorUtility';

/**
 * Abstract base class providing the core lifecycle and state management for all enumerators.
 *
 * @remarks
 * Handles the plumbing shared across all enumerator implementations: one-time initialization
 * via {@link initialize} before the first element, completion tracking so `next()` is safe to
 * call after the sequence ends, and resource cleanup via `return()`.
 *
 * Subclasses must implement:
 * - {@link handleNext} — produce the next element or signal completion
 * - {@link dispose} — orchestrate cleanup
 * - {@link disposeSource} — release the upstream source
 *
 * Helper methods {@link yield}, {@link done}, {@link doneWithYield}, and {@link earlyComplete}
 * let subclasses return well-formed `IteratorResult` values without boilerplate.
 *
 * @typeParam TInput - The input element type (used by subclasses that transform a source).
 * @typeParam TOutput - The type of elements produced by this enumerator.
 *
 * @group Enumerators
 * @internal
 */
export abstract class TyneqBaseEnumerator<TInput, TOutput = TInput> implements IEnumerator<TOutput> {
    private initialized = false;
    protected sourceDisposed = false;
    protected completed = false;

    public constructor() { }

    public next(): IteratorResult<TOutput> {
        if (this.completed) return this.done();

        if (!this.initialized) {
            this.initialize();
            this.initialized = true;
        }

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
     * Called once before the first element is produced. Override to set up state or resources.
     */
    protected initialize(): void { }

    /**
     * Returns an `IteratorResult` carrying `value`.
     *
     * @param value - The element to yield.
     * @returns `{ done: false, value }`
     */
    protected yield(value: TOutput): IteratorResult<TOutput> {
        return { done: false, value };
    }

    /**
     * Returns a completion `IteratorResult`.
     *
     * @returns `{ done: true, value: undefined }`
     */
    protected done(): IteratorResult<TOutput> {
        return { done: true, value: undefined };
    }

    /**
     * Marks the enumerator as completed and returns the final value.
     *
     * @param value - The final element to yield before completing.
     * @returns `{ done: false, value }`
     */
    protected doneWithYield(value: TOutput): IteratorResult<TOutput> {
        this.completed = true;
        return this.yield(value);
    }

    /**
     * Disposes resources and signals completion immediately.
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
     * @param value - Optional context passed through cleanup phases.
     */
    protected abstract dispose(value?: unknown): void;

    /**
     * Releases the upstream source enumerator.
     */
    protected abstract disposeSource(): void;

    /**
     * Releases additional resources specific to this enumerator. Override as needed.
     *
     * @param value - Optional context from the disposal trigger.
     */
    protected disposeAdditional(value?: unknown): void { }

    /**
     * Produces the next output element or signals completion.
     *
     * @returns An iterator result containing the next value or completion.
     */
    protected abstract handleNext(): IteratorResult<TOutput>;
}
