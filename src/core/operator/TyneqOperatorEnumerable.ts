import { IEnumerable, IEnumerator } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

export abstract class TyneqOperatorEnumerable<TSource, TResult = TSource> implements IEnumerable<TResult> {
    protected readonly source: IEnumerable<TSource>;

    public constructor(source: IEnumerable<TSource>) {
        ArgumentUtility.checkNotOptional(source, nameof({ source }));
        this.source = source;
    }

    [Symbol.iterator](): IEnumerator<TResult> {
        return this.getEnumerator();
    }

    public abstract getEnumerator(): IEnumerator<TResult>;
}