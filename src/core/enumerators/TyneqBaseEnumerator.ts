import { Enumerator } from "../../types/core";

/**
 * Abstract base class implementing the pull-iterator lifecycle for all Tyneq enumerators.
 *
 * @remarks
 * State machine:
 * - `next()` calls `initialize()` on the first invocation, then delegates to `handleNext()`.
 * - When `handleNext()` returns `{ done: true }`, the enumerator marks itself completed then disposes.
 * - `doneWithYield(value)` marks completed, disposes, then emits one final element.
 * - `earlyComplete()` marks completed and disposes without yielding.
 * - `return()` triggers early termination: marks completed then disposes. Idempotent.
 * - If `initialize()` or `handleNext()` throws, the enumerator is marked completed and disposed
 *   before the error is rethrown - it is not resumable after a throw.
 * - All completion paths route through one idempotent `complete()` step, so disposal always
 *   runs exactly once regardless of which path (done, `return()`, `earlyComplete()`, or throw)
 *   triggers it.
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

    /**
     * Advances the iterator, calling `initialize()` on first call. Idempotent after completion.
     *
     * @remarks
     * If `handleNext()` (or `initialize()`) throws, the enumerator disposes its resources and
     * marks itself completed before rethrowing - a thrown-through enumerator is dead, not
     * resumable. Every subsequent `next()` call then returns `{ done: true }`.
     */
    public next(): IteratorResult<TOutput> {
        if (this._completed) {
            return this.done();
        }

        try {
            if (!this._initialized) {
                this.initialize();
                this._initialized = true;
            }

            const result = this.handleNext();

            if (result.done) {
                this.complete();
                return this.done();
            }

            return result;
        } catch (error) {
            this.complete(error);
            throw error;
        }
    }

    /** Terminates iteration early, disposes resources, and marks completed. Idempotent. */
    public return(value?: unknown): IteratorResult<TOutput> {
        this.complete(value);
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
        this.complete();
        return this.yield(value);
    }

    /**
     * Disposes resources, marks completed, and returns a done result.
     *
     * @remarks
     * Use inside `handleNext()` to terminate iteration before the source is exhausted.
     */
    protected earlyComplete(reason?: unknown): IteratorResult<TOutput> {
        this.complete(reason);
        return this.done();
    }

    /** Calls `disposeSource()` then `disposeAdditional()`. */
    protected dispose(value?: unknown): void {
        this.disposeSource();
        this.disposeAdditional(value);
    }

    /**
     * Marks the enumerator completed (before disposing, so `dispose()` cannot be re-entered)
     * and calls `dispose()`, swallowing any error it throws so it can never mask the original
     * result or error being returned/rethrown by the caller. Idempotent: a no-op once completed.
     *
     * @remarks
     * `disposeAdditional()` is documented to never throw; this is a defensive backstop for
     * third-party subclasses that violate that contract.
     */
    private complete(value?: unknown): void {
        if (this._completed) {
            return;
        }

        this._completed = true;

        try {
            this.dispose(value);
        } catch {
            // dispose() must not throw per its documented contract; swallow defensively
            // so a violation never masks the real result or error.
        }
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
