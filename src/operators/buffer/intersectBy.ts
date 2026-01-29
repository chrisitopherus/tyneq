import { TyneqOperator } from "../../core/operator/TyneqOperator";
import { IntersectByEnumerator } from "../../enumerators/buffer/intersectBy";
import { IEnumerable, IteratorFactory } from "../../types/core";

export class IntersectByOperator<TSource, TKey> extends TyneqOperator<TSource> {
    private readonly keySelector: (item: TSource) => TKey;
    private readonly intersectedKeys: IEnumerable<TKey>;

    public constructor(source: IEnumerable<TSource>, intersectedKeys: IEnumerable<TKey>, keySelector: (item: TSource) => TKey) {
        super(source);
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
}