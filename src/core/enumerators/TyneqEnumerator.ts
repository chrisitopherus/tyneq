import { TyneqEnumerableEnumerator } from './TyneqEnumerableEnumerator';
import { IEnumerator } from '../../types/core';
import { ArgumentUtility } from '../../utility/argumentUtility';
import { EnumeratorUtility } from '../../utility/EnumeratorUtility';
import { TyneqBaseEnumerator } from './TyneqBaseEnumerator';

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
 * @see {@link TyneqEnumerableEnumerator} for working with enumerables.
 * @see {@link EnumeratorUtility.tryDispose} for the safe disposal mechanism.
 *
 * @group Enumerators
 * @internal
 */
export abstract class TyneqEnumerator<TInput, TOutput = TInput> extends TyneqBaseEnumerator<TOutput> {
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
        super();
        ArgumentUtility.checkNotOptional({ sourceEnumerator });

        this.sourceEnumerator = sourceEnumerator;
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
    protected override dispose(value?: unknown): void {
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
    protected override disposeSource(): void {
        if (this.sourceDisposed) return;

        this.sourceDisposed = true;
        EnumeratorUtility.tryDispose(this.sourceEnumerator);
    }
}
