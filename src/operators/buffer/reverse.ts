import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { ReverseEnumerator } from "../../enumerators/buffer/reverse";
import { IEnumerable, IEnumerator, IteratorFactory } from "../../types/core";

export class ReverseOperatorEnumerable<TSource> extends TyneqOperatorEnumerable<TSource> {
    public constructor(source: IEnumerable<TSource>) {
        super(source);
    }

    public getFactory(): IteratorFactory<TSource> {
        const source = this.source;
        return () => {
            return new ReverseEnumerator<TSource>(source[Symbol.iterator]());
        }
    }

    public override getEnumerator(): IEnumerator<TSource> {
        return new ReverseEnumerator<TSource>(this.source[Symbol.iterator]());
    }
}