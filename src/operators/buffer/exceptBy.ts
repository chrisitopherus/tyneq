import { TyneqOperator } from "../../core/operator/TyneqOperator";
import { ExceptByEnumerator } from "../../enumerators/buffer/exceptBy";
import { IEnumerable, IteratorFactory } from "../../types/core";

export class ExceptByOperator<TSource, TKey> extends TyneqOperator<TSource> {
    private readonly excludedKeys: IEnumerable<TKey>;
    private readonly keySelector: (item: TSource) => TKey;

    public constructor(source: IEnumerable<TSource>, excludedKeys: IEnumerable<TKey>, keySelector: (item: TSource) => TKey) {
        super(source);
        this.excludedKeys = excludedKeys;
        this.keySelector = keySelector;
    }

    public getFactory(): IteratorFactory<TSource> {
        const source = this.source;
        const excludedKeys = this.excludedKeys;
        const keySelector = this.keySelector;

        return () => {
            return new ExceptByEnumerator<TSource, TKey>(source[Symbol.iterator](), excludedKeys, keySelector);
        }
    }
}