import { IEnumerator } from "../../types/core";
import { EnumeratorUtility } from "../../utility/EnumeratorUtility";

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

    /** Returns `{ done: false, value }`. */
    protected yield(value: TOutput): IteratorResult<TOutput> {
        return { done: false, value };
    }

    /** Returns `{ done: true, value: undefined }`. */
    protected done(): IteratorResult<TOutput> {
        return { done: true, value: undefined };
    }

    /**
     * Marks the enumerator as completed and yields the final value in one step.
     *
     * @param value - The last element to emit before completing.
     */
    protected doneWithYield(value: TOutput): IteratorResult<TOutput> {
        this.completed = true;
        return this.yield(value);
    }

    /**
     * Disposes resources and signals completion immediately.
     *
     * @param reason - Optional reason or context for early completion.
     */
    protected earlyComplete(reason?: unknown): IteratorResult<TOutput> {
        this.dispose(reason);
        this.completed = true;
        return this.done();
    }

    protected abstract dispose(value?: unknown): void;

    protected abstract disposeSource(): void;

    /** Override to release resources beyond the source enumerator. */
    protected disposeAdditional(value?: unknown): void { }

    protected abstract handleNext(): IteratorResult<TOutput>;
}
