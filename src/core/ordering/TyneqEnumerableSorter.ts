import { Nullable } from "../../types/utility";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";
import { BaseEnumerableSorter } from "./BaseEnumerableSorter";

/**
 * Concrete sorter that extracts keys via a selector and compares them with a comparer.
 *
 * @remarks
 * Chains to a `next` sorter for secondary sort keys (thenBy). Stability is preserved by
 * falling back to index comparison when keys are equal at the innermost sorter level.
 *
 * @internal
 */
export class TyneqEnumerableSorter<TSource, TKey> extends BaseEnumerableSorter<TSource> {
    private keys: TKey[] = [];
    private readonly keySelector: (item: TSource) => TKey;
    private readonly comparer: (a: TKey, b: TKey) => number;
    private readonly descending: number;
    private next: Nullable<BaseEnumerableSorter<TSource>> = null;

    
    public constructor(keySelector: (item: TSource) => TKey, comparer: (a: TKey, b: TKey) => number, descending: boolean, next?: BaseEnumerableSorter<TSource>) {
        super();
        ArgumentUtility.checkNotOptional({ keySelector });
        ArgumentUtility.checkNotOptional({ comparer });

        this.keySelector = keySelector;
        this.comparer = comparer;
        this.descending = descending ? -1 : 1;
        this.next = next ?? null;
    }

    
    public override computeKeys(source: TSource[], count: number): void {
        this.keys = new Array<TKey>(count);
        for (let i = 0; i < count; i++) {
            this.keys[i] = this.keySelector(source[i]);
        }

        this.next?.computeKeys(source, count);
    }

    
    public override compareKeys(i: number, j: number): number {
        const result = this.comparer(this.keys[i], this.keys[j]) * this.descending;
        if (result !== 0) {
            return result;
        }

        if (this.next === null) {
            return this.stabilityCompare(i, j);
        }

        return this.next.compareKeys(i, j);
    }

    
    protected stabilityCompare(i: number, j: number): number {
        return i - j;
    }
}
