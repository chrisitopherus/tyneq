import { IEnumerable } from "../../types/core";

export abstract class TyneqTerminalOperator<TSource, TResult = TSource> {
    protected readonly source: IEnumerable<TSource>;

    public constructor(source: IEnumerable<TSource>) {
        this.source = source;
    }

    public abstract process(): TResult;
}