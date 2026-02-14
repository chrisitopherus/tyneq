import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { AppendEnumerator } from "../../enumerators/streaming/append";
import { IEnumerable, IEnumerator, IteratorFactory } from "../../types/core";

export class AppendOperatorEnumerable<TSource> extends TyneqOperatorEnumerable<TSource> {
    private readonly item: TSource;

    public constructor(source: IEnumerable<TSource>, item: TSource) {
        super(source);
        this.item = item;
    }

    public getFactory(): IteratorFactory<TSource> {
        const source = this.source;
        const item = this.item;
        
        return () => {
            return new AppendEnumerator<TSource>(source[Symbol.iterator](), item);
        }
    }

    public override getEnumerator(): IEnumerator<TSource> {
        return new AppendEnumerator<TSource>(this.source[Symbol.iterator](), this.item);
    }
}