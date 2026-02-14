import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { ShuffleEnumerator } from "../../enumerators/buffer/shuffle";
import { IEnumerable, IEnumerator, IteratorFactory } from "../../types/core";

export class ShuffleOperatorEnumerable<TSource> extends TyneqOperatorEnumerable<TSource> {
    public constructor(source: IEnumerable<TSource>) {
        super(source);
    }

    public getFactory(): IteratorFactory<TSource> {
        const source = this.source;
        return () => {
            return new ShuffleEnumerator<TSource>(source[Symbol.iterator]());
        }
    }

    public override getEnumerator(): IEnumerator<TSource> {
        return new ShuffleEnumerator<TSource>(this.source[Symbol.iterator]());
    }
}