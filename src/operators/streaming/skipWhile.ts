import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { SkipWhileEnumerator } from "../../enumerators/streaming/skipWhile";
import { IEnumerable, IEnumerator, IteratorFactory } from "../../types/core";

export class SkipWhileOperatorEnumerable<TSource> extends TyneqOperatorEnumerable<TSource> {
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

    public override getEnumerator(): IEnumerator<TSource> {
        return new SkipWhileEnumerator<TSource>(this.source[Symbol.iterator](), this.predicate);
    }
}