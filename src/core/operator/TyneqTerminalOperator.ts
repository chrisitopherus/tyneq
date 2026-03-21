import { IEnumerable } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";

/**
 * Abstract base class for terminal operators that evaluate a query and return a concrete value.
 *
 * @remarks
 * Terminal operators consume the source sequence and return a single result rather than
 * another enumerable. Subclasses implement {@link process} to define the specific evaluation
 * logic.
 *
 * @typeParam TSource - The type of elements in the source sequence.
 * @typeParam TResult - The type of the result value produced by the operator.
 *
 * @see {@link TyneqEnumerator} for the base class used by streaming and buffering enumerators.
 *
 * @group Classes
 */
export abstract class TyneqTerminalOperator<TSource, TResult = TSource> {
    protected readonly source: IEnumerable<TSource>;

    /**
     * @param source - The source sequence to evaluate. Must not be null or undefined.
     * @throws {ArgumentNullError} If `source` is null.
     * @throws {ArgumentError} If `source` is undefined.
     */
    public constructor(source: IEnumerable<TSource>) {
        ArgumentUtility.checkNotOptional({ source });
        this.source = source;
    }

    public abstract process(): TResult;
}
