import { TyneqOperator } from "../../core/operator/TyneqOperator";
import { AppendEnumerator } from "../../enumerators/streaming/append";
import { IEnumerable, IteratorFactory } from "../../types/core";

export class AppendOperator<TSource> extends TyneqOperator<TSource> {
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
}