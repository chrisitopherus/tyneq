import { TyneqEnumerableSourceEnumerator  } from "./TyneqEnumerableSourceEnumerator";
import { IEnumerator } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { EnumeratorUtility } from "../../utility/EnumeratorUtility";
import { TyneqEnumeratorCore } from "./TyneqEnumeratorCore";

/**
 * Abstract base class for enumerators that transform elements from an upstream `IEnumerator`.
 *
 * @remarks
 * Extends {@link TyneqEnumeratorCore} to wrap a source enumerator directly. Use this class
 * for streaming operators where a single enumerator is threaded through the entire operator
 * chain. For operators that re-enumerate an `IEnumerable`, use {@link TyneqEnumerableSourceEnumerator }.
 *
 * The source enumerator is validated in the constructor and safely disposed via
 * {@link EnumeratorUtility.tryDispose} when iteration ends or is cut short.
 *
 * @typeParam TInput - The type of elements produced by the source enumerator.
 * @typeParam TOutput - The type of elements yielded by this enumerator.
 *
 * @see {@link TyneqEnumerableSourceEnumerator } for working with enumerables.
 * @see {@link EnumeratorUtility.tryDispose} for the safe disposal mechanism.
 *
 * @group Enumerators
 */
export abstract class TyneqSourceEnumerator<TInput, TOutput = TInput> extends TyneqEnumeratorCore<TOutput> {
    protected readonly sourceEnumerator: IEnumerator<TInput>;

    /**
     * @param sourceEnumerator - The upstream enumerator to wrap. Must not be null or undefined.
     * @throws {ArgumentNullError} If `sourceEnumerator` is null.
     * @throws {ArgumentError} If `sourceEnumerator` is undefined.
     */
    public constructor(sourceEnumerator: IEnumerator<TInput>) {
        super();
        ArgumentUtility.checkNotOptional({ sourceEnumerator });

        this.sourceEnumerator = sourceEnumerator;
    }

    protected override disposeSource(): void {
        if (this.sourceDisposed) return;

        this.sourceDisposed = true;
        EnumeratorUtility.tryDispose(this.sourceEnumerator);
    }
}
