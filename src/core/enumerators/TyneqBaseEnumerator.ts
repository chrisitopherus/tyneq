import { Enumerator } from "../../types/core";

/**
 * Abstract base class implementing the pull-iterator lifecycle for all Tyneq enumerators.
 *
 * @remarks
 * State machine:
 * - `next()` calls `initialize()` on the first invocation, then delegates to `handleNext()`.
 * - When `handleNext()` returns `{ done: true }`, `dispose()` is called then the enumerator marks itself completed.
 * - `doneWithYield(value)` emits one final element, calls `dispose()`, then marks completed.
 * - `earlyComplete()` calls `dispose()` and marks completed without yielding.
 * - `return()` triggers early termination: calls `dispose()` then marks completed. Idempotent.
 * - Once completed, all `next()` calls return `{ done: true }` without re-invoking `handleNext()`.
 *
 * Subclasses must implement `handleNext()`. Override `initialize()`, `disposeSource()`, and
 * `disposeAdditional()` as needed.
 *
 * @typeParam TInput - Source element type.
 * @typeParam TOutput - Output element type (defaults to `TInput`).
 * @group Plugin
 */
export abstract class TyneqBaseEnumerator<TInput, TOutput = TInput> implements Enumerator<TOutput> {
    private _initialized = false;
    private _completed = false;

    public constructor() { }

    /** Advances the iterator, calling `initialize()` on first call. Idempotent after completion. */
    public next(): IteratorResult<TOutput> {
        if (this._completed) {
            return this.done();
        }

        if (!this._initialized) {
            this.initialize();
            this._initialized = true;
        }

        const result = this.handleNext();

        if (result.done) {
            this.dispose();
            this._completed = true;
            return this.done();
        }

        return result;
    }

    /** Terminates iteration early, disposes resources, and marks completed. Idempotent. */
    public return(value?: unknown): IteratorResult<TOutput> {
        if (!this._completed) {
            this.dispose(value);
            this._completed = true;
        }

        return this.done();
    }

    /** Called once before the first `handleNext()` invocation. Override to set up state. */
    protected initialize(): void { }

    /** Wraps `value` in a non-done `IteratorResult`. */
    protected yield(value: TOutput): IteratorResult<TOutput> {
        return { done: false, value };
    }

    /** Returns a done `IteratorResult`. */
    protected done(): IteratorResult<TOutput> {
        return { done: true, value: undefined };
    }

    /**
     * Marks the enumerator completed and yields `value` as the final element.
     *
     * @remarks
     * Use when the last element must be emitted together with completion in one step.
     */
    protected doneWithYield(value: TOutput): IteratorResult<TOutput> {
        this.dispose();
        this._completed = true;
        return this.yield(value);
    }

    /**
     * Disposes resources, marks completed, and returns a done result.
     *
     * @remarks
     * Use inside `handleNext()` to terminate iteration before the source is exhausted.
     */
    protected earlyComplete(reason?: unknown): IteratorResult<TOutput> {
        this.dispose(reason);
        this._completed = true;
        return this.done();
    }

    /** Calls `disposeSource()` then `disposeAdditional()`. */
    protected dispose(value?: unknown): void {
        this.disposeSource();
        this.disposeAdditional(value);
    }

    /** Override to dispose the upstream source enumerator. */
    protected disposeSource(): void { }

    /**
     * Override to release any additional resources.
     *
     * @remarks
     * Called after `disposeSource()`. `value` is the return value passed to `return()`.
     * Must be idempotent and must not throw.
     */
    protected disposeAdditional(_value?: unknown): void { }

    /** Produces the next element. Return `{ done: true }` to signal exhaustion. */
    protected abstract handleNext(): IteratorResult<TOutput>;
}
