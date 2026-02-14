import { IEnumerable, IEnumerator } from "../../types/core";

export abstract class TyneqOperator<TSource, TResult = TSource> implements IEnumerable<TResult> {

    public constructor() { }

    [Symbol.iterator](): IEnumerator<TResult> {
        return this.getEnumerator();
    }

    public abstract getEnumerator(): IEnumerator<TResult>;
}