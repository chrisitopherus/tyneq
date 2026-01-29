import { TyneqOperator } from "../../core/operator/TyneqOperator";
import { DistinctByEnumerator } from "../../enumerators/buffer/distinctBy";
import { IEnumerable, IteratorFactory } from "../../types/core";

export class DistinctByOperator<TSource, TKey> extends TyneqOperator<TSource> {
    private readonly keySelector: (item: TSource) => TKey;

    public constructor(source: IEnumerable<TSource>, keySelector: (item: TSource) => TKey) {
        super(source);
        this.keySelector = keySelector;
    }

    public getFactory(): IteratorFactory<TSource> {
        const source = this.source;
        const keySelector = this.keySelector;
        return () => {
            return new DistinctByEnumerator<TSource, TKey>(source[Symbol.iterator](), keySelector);
        }
    }
}