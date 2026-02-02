import { IEnumerable, IteratorFactory } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

export abstract class TyneqOperator<TSource, TResult = TSource> {
    protected readonly source: IEnumerable<TSource>;

    public constructor(source: IEnumerable<TSource>) {
        ArgumentUtility.checkNotOptional(source, nameof({ source }));
        this.source = source;
    }

    public abstract getFactory(): IteratorFactory<TResult>;
}