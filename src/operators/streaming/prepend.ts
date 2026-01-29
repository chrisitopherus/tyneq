import { TyneqOperator } from "../../core/operator/TyneqOperator";
import { PrependEnumerator } from "../../enumerators/streaming/prepend";
import { IEnumerable, IteratorFactory } from "../../types/core";

export class PrependOperator<TSource> extends TyneqOperator<TSource> {
    private readonly item: TSource;

    public constructor(source: IEnumerable<TSource>, item: TSource) {
        super(source);
        this.item = item;
    }

    public getFactory(): IteratorFactory<TSource> {
        const source = this.source;
        const item = this.item;

        return () => {
            return new PrependEnumerator<TSource>(source[Symbol.iterator](), item);
        }
    }
}