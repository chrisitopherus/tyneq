import { TyneqOperator } from "../../core/operator/TyneqOperator";
import { ReverseEnumerator } from "../../enumerators/buffer/reverse";
import { IEnumerable, IteratorFactory } from "../../types/core";

export class ReverseOperator<TSource> extends TyneqOperator<TSource> {
    public constructor(source: IEnumerable<TSource>) {
        super(source);
    }

    public getFactory(): IteratorFactory<TSource> {
        const source = this.source;
        return () => {
            return new ReverseEnumerator<TSource>(source[Symbol.iterator]());
        }
    }
}