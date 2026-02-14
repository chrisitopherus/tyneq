import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { PrependEnumerator } from "../../enumerators/streaming/prepend";
import { IEnumerable, IEnumerator, IteratorFactory } from "../../types/core";

export class PrependOperatorEnumerable<TSource> extends TyneqOperatorEnumerable<TSource> {
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

    public override getEnumerator(): IEnumerator<TSource> {
        return new PrependEnumerator<TSource>(this.source[Symbol.iterator](), this.item);
    }
}