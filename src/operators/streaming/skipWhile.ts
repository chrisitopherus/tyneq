import { TyneqOperator } from "../../core/operator/TyneqOperator";
import { SkipWhileEnumerator } from "../../enumerators/streaming/skipWhile";
import { IEnumerable, IteratorFactory } from "../../types/core";

export class SkipWhileOperator<TSource> extends TyneqOperator<TSource> {
    private readonly predicate: (item: TSource) => boolean;

    public constructor(source: IEnumerable<TSource>, predicate: (item: TSource) => boolean) {
        super(source);
        this.predicate = predicate;
    }

    public getFactory(): IteratorFactory<TSource> {
        const source = this.source;
        const predicate = this.predicate;

        return () => {
            return new SkipWhileEnumerator<TSource>(source[Symbol.iterator](), predicate);
        }
    }
}