import { IEnumerable } from "../../types/core";

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
 * @internal
 */
export abstract class TyneqTerminalOperator<TSource, TResult = TSource> {
    protected readonly source: IEnumerable<TSource>;

    public constructor(source: IEnumerable<TSource>) {
        this.source = source;
    }

    public abstract process(): TResult;
}
