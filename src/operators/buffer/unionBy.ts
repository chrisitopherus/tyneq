import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { UnionByEnumerator } from "../../enumerators/buffer/unionBy";
import { IEnumerable, IEnumerator, IteratorFactory } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

export class UnionByOperatorEnumerable<TSource, TKey> extends TyneqOperatorEnumerable<TSource> {
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

    public override getEnumerator(): IEnumerator<TSource> {
        return new UnionByEnumerator<TSource, TKey>(this.source[Symbol.iterator](), this.otherValues, this.keySelector);
    }
}