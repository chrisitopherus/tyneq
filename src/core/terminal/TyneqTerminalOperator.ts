import { Enumerable } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";

/**
 * Abstract base for all terminal operators.
 *
 * @remarks
 * Terminal operators consume a sequence and return a concrete value.
 * Subclasses implement `process()` which enumerates `this.source` and returns the result.
 * Register with `@terminal` or `createTerminalOperator`.
 *
 * @typeParam TSource - Element type of the source sequence.
 * @typeParam TResult - The return type of `process()`.
 * @internal
 */
export abstract class TyneqTerminalOperator<TSource, TResult = TSource> {
    protected readonly source: Enumerable<TSource>;

    public constructor(source: Enumerable<TSource>) {
        ArgumentUtility.checkNotOptional({ source });
        this.source = source;
    }

    /** Executes the terminal operation and returns the result. */
    public abstract process(): TResult;
}
