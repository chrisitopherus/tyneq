import { IEnumerable, IEnumerator } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";
import { TyneqEnumeratorCore } from "./TyneqEnumeratorCore";

/**
 * Abstract base class for enumerators that transform elements from an `IEnumerable` source.
 *
 * @remarks
 * Extends {@link TyneqEnumeratorCore} to hold an `IEnumerable<TInput>` rather than a raw
 * enumerator. Use this class when the operator needs to obtain a fresh enumerator on each
 * pass over the source. For operators that consume an enumerator directly, use
 * {@link TyneqEnumerator}.
 *
 * The source enumerable is validated in the constructor.
 *
 * @typeParam TInput - The type of elements in the source enumerable.
 * @typeParam TOutput - The type of elements yielded by this enumerator.
 *
 * @see {@link TyneqEnumerator} for working with enumerators directly.
 *
 * @remarks
 * `IEnumerable` itself carries no disposal contract — only the `IEnumerator` instances it
 * creates do, and those are managed by whoever calls `getEnumerator()`. `disposeSource()`
 * is therefore a no-op for this class and is inherited from {@link TyneqEnumeratorCore}.
 *
 * @deprecated No built-in operator currently extends this class. All operators (including
 * those with buffer semantics) extend {@link TyneqEnumerator} and declare
 * `@operator('name', 'buffer')` to register with the correct kind. This class is kept for
 * backward compatibility and `inferOperatorKind` still detects it. Prefer `TyneqEnumerator`
 * for all new operator implementations.
 *
 * @group Enumerators
 * @internal
 */
export abstract class TyneqEnumerableSourceEnumerator <TInput, TOutput = TInput> extends TyneqEnumeratorCore<TOutput> {
    protected readonly sourceEnumerable: IEnumerable<TInput>;

    /**
     * @param sourceEnumerable - The enumerable sequence to iterate over. Must not be null or undefined.
     * @throws {ArgumentNullError} If `sourceEnumerable` is null.
     * @throws {ArgumentError} If `sourceEnumerable` is undefined.
     */
    public constructor(sourceEnumerable: IEnumerable<TInput>) {
        super();
        ArgumentUtility.checkNotOptional({ sourceEnumerable });

        this.sourceEnumerable = sourceEnumerable;
    }

}
