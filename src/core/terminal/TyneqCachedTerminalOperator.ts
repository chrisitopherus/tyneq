import { CachedEnumerable } from "../../types/core";
import { ArgumentUtility } from "../../utility/ArgumentUtility";

/**
 * Abstract base for terminal operators that require a fully cached sequence.
 *
 * @remarks
 * Use this when your terminal operator needs access to cached-sequence members
 * (the internal cache, `refresh()`, etc.). Register with `@cachedTerminal` or
 * `createCachedTerminalOperator`.
 *
 * @typeParam TSource - Element type of the source sequence.
 * @typeParam TResult - The return type of `process()`.
 * @group Plugin
 */
export abstract class TyneqCachedTerminalOperator<TSource, TResult = TSource> {
    protected readonly source: CachedEnumerable<TSource>;

    public constructor(source: CachedEnumerable<TSource>) {
        ArgumentUtility.checkNotOptional({ source });
        this.source = source;
    }

    /** Executes the terminal operation and returns the result. */
    public abstract process(): TResult;
}
