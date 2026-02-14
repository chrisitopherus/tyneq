import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { DistinctEnumerator } from "../../enumerators/buffer/distinct";
import { IEnumerable, IEnumerator, IteratorFactory } from "../../types/core";

export class DistinctOperatorEnumerable<TSource> extends TyneqOperatorEnumerable<TSource> {
    public constructor(source: IEnumerable<TSource>) {
        super(source);
    }

    public getFactory(): IteratorFactory<TSource> {
        const source = this.source;
        return () => {
            return new DistinctEnumerator<TSource>(source[Symbol.iterator]());
        }
    }

    public override getEnumerator(): IEnumerator<TSource> {
        return new DistinctEnumerator<TSource>(this.source[Symbol.iterator]());
    }
}