import { TyneqOperator } from "../../core/operator/TyneqOperator";
import { DistinctByEnumerator } from "../../enumerators/buffer/distinctBy";
import { IEnumerable, IteratorFactory } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

export class DistinctByOperator<TSource, TKey> extends TyneqOperator<TSource> {
    private readonly keySelector: (item: TSource) => TKey;

    public constructor(source: IEnumerable<TSource>, keySelector: (item: TSource) => TKey) {
        super(source);
        ArgumentUtility.checkNotOptional(keySelector, nameof({ keySelector }));

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