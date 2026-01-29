import { TyneqOperator } from "../../core/operator/TyneqOperator";
import { DistinctEnumerator } from "../../enumerators/buffer/distinct";
import { IEnumerable, IteratorFactory } from "../../types/core";

export class DistinctOperator<TSource> extends TyneqOperator<TSource> {
    public constructor(source: IEnumerable<TSource>) {
        super(source);
    }

    public getFactory(): IteratorFactory<TSource> {
        const source = this.source;
        return () => {
            return new DistinctEnumerator<TSource>(source[Symbol.iterator]());
        }
    }
}