import { TyneqOperator } from "../../core/operator/TyneqOperator";
import { ShuffleEnumerator } from "../../enumerators/buffer/shuffle";
import { IEnumerable, IteratorFactory } from "../../types/core";

export class ShuffleOperator<TSource> extends TyneqOperator<TSource> {
    public constructor(source: IEnumerable<TSource>) {
        super(source);
    }

    public getFactory(): IteratorFactory<TSource> {
        const source = this.source;
        return () => {
            return new ShuffleEnumerator<TSource>(source[Symbol.iterator]());
        }
    }
}