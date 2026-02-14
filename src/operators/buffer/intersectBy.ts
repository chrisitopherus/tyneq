import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { IntersectByEnumerator } from "../../enumerators/buffer/intersectBy";
import { IEnumerable, IEnumerator, IteratorFactory } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

export class IntersectByOperatorEnumerable<TSource, TKey> extends TyneqOperatorEnumerable<TSource> {
    private readonly keySelector: (item: TSource) => TKey;
    private readonly intersectedKeys: IEnumerable<TKey>;

    public constructor(source: IEnumerable<TSource>, intersectedKeys: IEnumerable<TKey>, keySelector: (item: TSource) => TKey) {
        super(source);
        ArgumentUtility.checkNotOptional(intersectedKeys, nameof({ intersectedKeys }));
        ArgumentUtility.checkNotOptional(keySelector, nameof({ keySelector }));

        this.intersectedKeys = intersectedKeys;
        this.keySelector = keySelector;
    }

    public getFactory(): IteratorFactory<TSource> {
        const source = this.source;
        const intersectedKeys = this.intersectedKeys;
        const keySelector = this.keySelector;
        return () => {
            return new IntersectByEnumerator<TSource, TKey>(source[Symbol.iterator](), intersectedKeys, keySelector);
        }
    }

    public override getEnumerator(): IEnumerator<TSource> {
        return new IntersectByEnumerator<TSource, TKey>(
            this.source[Symbol.iterator](),
            this.intersectedKeys,
            this.keySelector
        );
    }
}