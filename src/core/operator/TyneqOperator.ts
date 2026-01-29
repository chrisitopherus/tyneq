import { IEnumerable, IteratorFactory } from "../../types/core";

export abstract class TyneqOperator<TSource, TResult = TSource> {
    protected readonly source: IEnumerable<TSource>;

    public constructor(source: IEnumerable<TSource>) {
        this.source = source;
    }

    public abstract getFactory(): IteratorFactory<TResult>;
}