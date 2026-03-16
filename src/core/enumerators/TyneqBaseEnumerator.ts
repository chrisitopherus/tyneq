import { IEnumerator } from "../../types/core";
import { EnumeratorUtility } from "../../utility/EnumeratorUtility";

/**
 * Abstract base class providing the core lifecycle and state management for all enumerators.
 *
 * @remarks
 * ## Lifecycle
 *
 * An enumerator moves through four states:
 *
 * ```
 * UNINITIALIZED ──(first next())──▶ INITIALIZED ──(handleNext returns done)──▶ COMPLETED
 *                                        │
 *                                   (return())
 *                                        │
 *                                        ▼
 *                                    COMPLETED
 * ```
 *
 * 1. **UNINITIALIZED** — constructed but `next()` has not been called. {@link initialize}
 *    has not run. No iteration state is safe to read.
 * 2. **INITIALIZED** — {@link initialize} has run exactly once (on the first `next()` call).
 *    {@link handleNext} is called for every subsequent `next()`.
 * 3. **COMPLETED** — either {@link handleNext} returned `{ done: true }`, or {@link return}
 *    was called for early termination. All further `next()` calls immediately return
 *    `{ done: true, value: undefined }` without calling `handleNext` again.
 *
 * ## Disposal order
 *
 * When the enumerator completes (naturally or via `return()`), resources are released in this order:
 * 1. {@link disposeSource} — releases the upstream source enumerator.
 * 2. {@link disposeAdditional} — releases any additional state held by the subclass.
 *
 * ## Idempotency
 *
 * - `return()` is safe to call multiple times; `dispose()` runs at most once (guarded by
 *   the `completed` flag).
 * - `disposeSource()` is safe to call multiple times (guarded by the `sourceDisposed` flag).
 * - Subclasses that override `disposeAdditional()` should guard it with their own flag.
 *
 * ## `throw()` is not supported
 *
 * `IEnumerator<T>` declares an optional `throw?(e?: unknown)` to match the JavaScript iterator
 * protocol. No concrete enumerator in Tyneq implements it — the execution model does not inject
 * exceptions into pipelines. If a consumer throws into an enumerator, the call will either be
 * a no-op (method not present) or propagate as-is. Handle errors at the consumer level with a
 * standard `try/catch` around iteration.
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

    /**
     * Signals early termination, disposes resources, and marks the enumerator as completed.
     *
     * @remarks
     * Idempotent — safe to call multiple times. The first call disposes resources and sets
     * `completed = true`; subsequent calls are no-ops that return `{ done: true }` immediately.
     *
     * @param value - Optional reason or context passed to {@link dispose}.
     */
    public return(value?: unknown): IteratorResult<TOutput> {
        if (!this.completed) {
            this.dispose(value);
            this.completed = true;
        }
        return this.done();
    }

    /**
     * Called once before the first element is produced. Override to set up state or resources.
     *
     * @remarks
     * Guaranteed to run exactly once, on the first call to `next()`. The enumerator is in the
     * UNINITIALIZED state when this runs; `handleNext()` will not be called until after
     * `initialize()` returns.
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
     * @remarks
     * Use when the last element to emit signals the natural end of the sequence. Sets
     * `completed = true` so the next call to `next()` returns `done()` without calling
     * `handleNext()` again.
     *
     * @param value - The last element to emit before completing.
     */
    protected doneWithYield(value: TOutput): IteratorResult<TOutput> {
        this.completed = true;
        return this.yield(value);
    }

    /**
     * Disposes resources and signals completion immediately, without yielding a value.
     *
     * @remarks
     * Use inside `handleNext()` when the operator detects an early-termination condition
     * (e.g., `take(n)` has emitted all `n` elements). Calls {@link dispose} then sets
     * `completed = true`.
     *
     * @param reason - Optional reason or context forwarded to {@link dispose}.
     */
    protected earlyComplete(reason?: unknown): IteratorResult<TOutput> {
        this.dispose(reason);
        this.completed = true;
        return this.done();
    }

    /**
     * Orchestrates resource cleanup. Called by both {@link return} and {@link earlyComplete}.
     *
     * @remarks
     * Implementations must call {@link disposeSource} first, then {@link disposeAdditional},
     * to ensure the upstream source is released before subclass-specific state.
     * See {@link TyneqEnumerator} for the canonical implementation.
     */
    protected abstract dispose(value?: unknown): void;

    /**
     * Releases the upstream source enumerator (if any).
     *
     * @remarks
     * Must be idempotent. {@link TyneqEnumerator} guards this with the `sourceDisposed` flag.
     */
    protected abstract disposeSource(): void;

    /**
     * Override to release resources beyond the upstream source.
     *
     * @remarks
     * Called by {@link dispose} **after** {@link disposeSource} — the upstream source is
     * already released when this runs. The `value` parameter is the reason passed to
     * {@link return} or {@link earlyComplete}; it is informational only and may be ignored.
     *
     * Implementations should be idempotent (guard with a `disposed` flag if holding
     * mutable state like internal buffers). Implementations must not throw — any exception
     * thrown here will propagate out of `return()` or `earlyComplete()`, which is unexpected
     * for cleanup code.
     *
     * @param value - Optional reason or context from the originating `return()` call.
     */
    protected disposeAdditional(value?: unknown): void { }

    protected abstract handleNext(): IteratorResult<TOutput>;
}
