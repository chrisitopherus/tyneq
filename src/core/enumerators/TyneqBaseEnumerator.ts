import { Enumerator } from "../../types/core";

/**
 * Abstract base class providing the core lifecycle and state management for all enumerators.
 *
 * @remarks
 * ## Lifecycle
 *
 * An enumerator moves through three states:
 *
 * ```
 * UNINITIALIZED ──(first next())──▶ INITIALIZED ──(handleNext returns done)──▶ COMPLETED
 *                                        │
 *                                  (return() or earlyComplete())
 *                                        │
 *                                        ▼
 *                                    COMPLETED
 * ```
 *
 * 1. **UNINITIALIZED** — constructed but `next()` has not been called. {@link initialize}
 *    has not run. No iteration state is safe to read.
 * 2. **INITIALIZED** — {@link initialize} has run exactly once (on the first `next()` call).
 *    {@link handleNext} is called on that same first `next()` and every one after it.
 * 3. **COMPLETED** — the sequence has ended. All further `next()` calls immediately return
 *    `{ done: true, value: undefined }` without invoking `handleNext` again.
 *
 * ## How the sequence ends
 *
 * There are two distinct completion paths with different disposal behaviour:
 *
 * - **Natural completion** — {@link handleNext} returns {@link done} or {@link doneWithYield}.
 *   The source was fully consumed; `next()` marks the enumerator completed. {@link dispose}
 *   is **not** called because the upstream source has also terminated naturally and holds no
 *   further resources.
 * - **Early completion** — {@link earlyComplete} (from inside `handleNext`) or {@link return}
 *   (from the consumer, e.g. `for...of` breaking early). {@link dispose} **is** called to
 *   release any upstream source enumerator that has not yet been exhausted.
 *
 * Choose the right helper in `handleNext()`:
 *
 * | Situation | Helper |
 * |---|---|
 * | Another element exists; more may follow | {@link yield} |
 * | Source is exhausted; no element to emit | {@link done} |
 * | Source is exhausted; one final element to emit | {@link doneWithYield} |
 * | Operator decides to stop before source is exhausted | {@link earlyComplete} |
 *
 * ## Disposal order
 *
 * When disposal runs (via `return()` or `earlyComplete()`), resources are released in this order:
 * 1. {@link disposeSource} — releases the upstream source enumerator.
 * 2. {@link disposeAdditional} — releases any additional state held by the subclass.
 *
 * ## Idempotency
 *
 * - `return()` is safe to call multiple times; `dispose()` runs at most once (guarded by
 *   the `completed` flag).
 * - Subclasses that override `disposeSource()` must guard with `sourceDisposed` for idempotency.
 * - Subclasses that override `disposeAdditional()` should guard with their own flag.
 *
 * ## `throw()` is not supported
 *
 * `Enumerator<T>` declares an optional `throw?(e?: unknown)` to match the JavaScript iterator
 * protocol. No concrete enumerator in Tyneq implements it — the execution model does not inject
 * exceptions into pipelines. If a consumer throws into an enumerator, the call will either be
 * a no-op (method not present) or propagate as-is. Handle errors at the consumer level with a
 * standard `try/catch` around iteration.
 *
 * @typeParam TInput - The element type of the upstream source; may differ from `TOutput` when
 *   the operator transforms elements. Unused by the base class itself — present for subclasses.
 * @typeParam TOutput - The type of elements produced by this enumerator.
 *
 * @group Enumerators
 */
export abstract class TyneqBaseEnumerator<TInput, TOutput = TInput> implements Enumerator<TOutput> {
    private initialized = false;
    protected sourceDisposed = false;
    protected completed = false;

    public constructor() { }

    /**
     * Advances the enumerator and returns the next result.
     *
     * @remarks
     * Do not override — override {@link handleNext} to control element production.
     * Calling this method on a completed enumerator is safe; it returns `{ done: true }`
     * immediately without invoking `handleNext` or `initialize`.
     */
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
     * Signals early termination from outside the enumerator (e.g. a `break` in `for...of`).
     *
     * @remarks
     * Idempotent — safe to call multiple times. The first call invokes {@link dispose} to
     * release any upstream source that has not been exhausted, then sets `completed = true`.
     * Subsequent calls return `{ done: true }` immediately without re-disposing.
     *
     * To trigger early termination from **inside** {@link handleNext}, use {@link earlyComplete}
     * rather than calling `return()` directly.
     *
     * @param value - Optional reason or context forwarded to {@link dispose}; informational only.
     */
    public return(value?: unknown): IteratorResult<TOutput> {
        if (!this.completed) {
            this.dispose(value);
            this.completed = true;
        }
        return this.done();
    }

    /**
     * Called once before the first element is produced. Override to allocate state or acquire resources.
     *
     * @remarks
     * Runs exactly once, on the first call to `next()`. `handleNext()` is not called until after
     * this method returns. Override in buffering operators to load the full source into an
     * internal buffer; leave empty for operators that do not need one-time setup.
     */
    protected initialize(): void { }

    /**
     * Wraps `value` in a non-terminal result for return from {@link handleNext}.
     *
     * @remarks
     * Use for every element produced while the sequence continues. When the **last** element
     * can be identified at the point it is emitted — and the source is now exhausted — prefer
     * {@link doneWithYield} to complete and emit in a single step, avoiding one extra
     * `handleNext` invocation.
     */
    protected yield(value: TOutput): IteratorResult<TOutput> {
        return { done: false, value };
    }

    /**
     * Produces a terminal result for return from {@link handleNext} when the source is naturally exhausted.
     *
     * @remarks
     * Use when the source has been fully consumed and there is no element left to emit.
     * Does **not** call {@link dispose} — appropriate because the upstream source has also
     * terminated naturally and holds no further resources.
     *
     * If one final element is available alongside the end-of-source signal, prefer
     * {@link doneWithYield} — it emits and completes in one step.
     *
     * If the operator is stopping **before** the source is exhausted (e.g., `take(n)` has
     * reached its limit), use {@link earlyComplete} instead — it calls {@link dispose} to
     * propagate early termination to the upstream source.
     */
    protected done(): IteratorResult<TOutput> {
        return { done: true, value: undefined };
    }

    /**
     * Emits a final element and marks the enumerator as completed in one step.
     *
     * @remarks
     * Use when the last element can be detected at the point it is emitted and the source
     * is now exhausted. Sets `completed = true` so the next `next()` call returns `done()`
     * without invoking `handleNext` again.
     *
     * Does **not** call {@link dispose} — same rationale as {@link done}: the source was
     * naturally exhausted.
     *
     * Do not use when the operator stops **before** the source is exhausted; use
     * {@link earlyComplete} in that case to release upstream resources.
     *
     * @param value - The last element to emit.
     */
    protected doneWithYield(value: TOutput): IteratorResult<TOutput> {
        this.completed = true;
        return this.yield(value);
    }

    /**
     * Disposes upstream resources and completes the enumerator without emitting a value.
     *
     * @remarks
     * Use inside {@link handleNext} when the operator decides to stop **before** the source is
     * exhausted — for example, when `take(n)` has emitted all `n` elements. Calls
     * {@link dispose} to propagate early termination to the upstream source enumerator, then
     * sets `completed = true`.
     *
     * Do **not** use when the source has been naturally exhausted; use {@link done} or
     * {@link doneWithYield} instead. Those paths skip disposal deliberately because the upstream
     * source has also terminated and holds no further resources.
     *
     * @param reason - Optional reason or context forwarded to {@link dispose}; informational only.
     */
    protected earlyComplete(reason?: unknown): IteratorResult<TOutput> {
        this.dispose(reason);
        this.completed = true;
        return this.done();
    }

    /**
     * Orchestrates resource cleanup. Called by {@link return} and {@link earlyComplete}.
     *
     * @remarks
     * Default implementation calls {@link disposeSource} then {@link disposeAdditional} in that
     * order, ensuring the upstream source is released before subclass-specific state. Override
     * only when the standard disposal order is insufficient.
     */
    protected dispose(value?: unknown): void {
        this.disposeSource();
        this.disposeAdditional(value);
    }

    /**
     * Releases the upstream source enumerator (if any).
     *
     * @remarks
     * Default is a no-op — suitable for source generators with no upstream to release.
     * Subclasses that hold a source enumerator should override and guard with `sourceDisposed`
     * for idempotency. See {@link TyneqEnumerator} for the standard implementation.
     */
    protected disposeSource(): void { }

    /**
     * Override to release subclass-specific resources (internal buffers, secondary enumerators, etc.).
     *
     * @remarks
     * Called by {@link dispose} **after** {@link disposeSource} — the upstream source is
     * already released when this runs.
     *
     * Implementations must be idempotent: guard with a private flag when holding mutable state
     * such as a buffer array. Implementations must not throw - any exception propagates out of
     * `return()` or `earlyComplete()`, which callers do not expect from cleanup code.
     *
     * @param value - Reason or context passed from {@link return} or {@link earlyComplete};
     *   informational only, may be ignored.
     */
    protected disposeAdditional(value?: unknown): void { }

    /**
     * Produces the next element or signals completion.
     *
     * @remarks
     * The single method to implement in every concrete enumerator. Called by `next()` after
     * `initialize()` has run — on the first call and every one after it.
     *
     * Return exactly one of the four helpers based on the current state of the source:
     *
     * | Source state | Helper to return |
     * |---|---|
     * | Element available; more may follow | `yield(value)` |
     * | Source exhausted; no element | `done()` |
     * | Source exhausted; one last element | `doneWithYield(value)` |
     * | Stopping early (source not yet exhausted) | `earlyComplete()` |
     *
     * Returning a raw `{ done: false, value }` object is legal but prefer the typed helpers
     * for consistency and to benefit from the `doneWithYield` / `earlyComplete` shortcuts.
     */
    protected abstract handleNext(): IteratorResult<TOutput>;
}
