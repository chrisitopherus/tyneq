import { IEnumerable, IEnumerator } from '../../types/core';
import { ArgumentUtility } from '../../utility/argumentUtility';
import { nameof } from '../../utility/nameof';
import { TyneqBaseEnumerator } from './TyneqBaseEnumerator';

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
export abstract class TyneqEnumerableEnumerator<TInput, TOutput = TInput> extends TyneqBaseEnumerator<TOutput> {
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
        super();
        ArgumentUtility.checkNotOptional(sourceEnumerable, nameof({ sourceEnumerable }));

        this.sourceEnumerable = sourceEnumerable;
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
}