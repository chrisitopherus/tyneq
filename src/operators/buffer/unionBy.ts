import { TyneqOperator } from "../../core/operator/TyneqOperator";
import { ExceptByEnumerator } from "../../enumerators/buffer/exceptBy";
import { UnionByEnumerator } from "../../enumerators/buffer/unionBy";
import { IEnumerable, IteratorFactory } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

export class UnionByOperator<TSource, TKey> extends TyneqOperator<TSource> {
    private readonly otherValues: IEnumerable<TSource>;
    private readonly keySelector: (item: TSource) => TKey;

    public constructor(source: IEnumerable<TSource>, otherValues: IEnumerable<TSource>, keySelector: (item: TSource) => TKey) {
        super(source);
        ArgumentUtility.checkNotOptional(otherValues, nameof({ otherValues }));
        ArgumentUtility.checkNotOptional(keySelector, nameof({ keySelector }));

        this.otherValues = otherValues;
        this.keySelector = keySelector;
    }

    public getFactory(): IteratorFactory<TSource> {
        const source = this.source;
        const otherValues = this.otherValues;
        const keySelector = this.keySelector;

        return () => {
            return new UnionByEnumerator<TSource, TKey>(source[Symbol.iterator](), otherValues, keySelector);
        }
    }
}