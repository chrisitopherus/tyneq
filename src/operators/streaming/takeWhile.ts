import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { TakeWhileEnumerator } from "../../enumerators/streaming/takeWhile";
import { IEnumerable, IEnumerator, IteratorFactory } from "../../types/core";

export class TakeWhileOperatorEnumerable<TSource> extends TyneqOperatorEnumerable<TSource> {
    private readonly predicate: (item: TSource) => boolean;

    public constructor(source: IEnumerable<TSource>, predicate: (item: TSource) => boolean) {
        super(source);
        this.predicate = predicate;
    }

    public getFactory(): IteratorFactory<TSource> {
        const source = this.source;
        const predicate = this.predicate;

        return () => {
            return new TakeWhileEnumerator<TSource>(source[Symbol.iterator](), predicate);
        }
    }

    public override getEnumerator(): IEnumerator<TSource> {
        return new TakeWhileEnumerator<TSource>(this.source[Symbol.iterator](), this.predicate);
    }
}