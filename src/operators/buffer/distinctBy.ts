import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { DistinctByEnumerator } from "../../enumerators/buffer/distinctBy";
import { IEnumerable, IEnumerator, IteratorFactory } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

export class DistinctByOperatorEnumerable<TSource, TKey> extends TyneqOperatorEnumerable<TSource> {
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

    public override getEnumerator(): IEnumerator<TSource> {
        return new DistinctByEnumerator<TSource, TKey>(this.source[Symbol.iterator](), this.keySelector);
    }
}