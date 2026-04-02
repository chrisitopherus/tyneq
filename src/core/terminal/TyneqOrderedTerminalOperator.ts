import { OrderedEnumerable } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";

/**
 * Abstract base for terminal operators that require a fully ordered sequence.
 *
 * @remarks
 * Use this when your terminal operator needs access to ordered-sequence members
 * (comparers, parent chain, etc.). Register with `@orderedTerminal` or
 * `createOrderedTerminalOperator`.
 *
 * @typeParam TSource - Element type of the source sequence.
 * @typeParam TResult - The return type of `process()`.
 * @internal
 */
export abstract class TyneqOrderedTerminalOperator<TSource, TResult = TSource> {
    protected readonly source: OrderedEnumerable<TSource>;

    public constructor(source: OrderedEnumerable<TSource>) {
        ArgumentUtility.checkNotOptional({ source });
        this.source = source;
    }

    /** Executes the terminal operation and returns the result. */
    public abstract process(): TResult;
}
