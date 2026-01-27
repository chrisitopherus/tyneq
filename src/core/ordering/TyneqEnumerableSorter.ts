import { Nullable } from "../../types/utility";
import { BaseEnumerableSorter } from "./BaseEnumerableSorter";

export class TyneqEnumerableSorter<TSource, TKey> extends BaseEnumerableSorter<TSource> {
    private keys: TKey[] = [];
    private readonly keySelector: (item: TSource) => TKey;
    private readonly comparer: (a: TKey, b: TKey) => number;
    private readonly descending: number;
    private next: Nullable<BaseEnumerableSorter<TSource>> = null;

    public constructor(keySelector: (item: TSource) => TKey, comparer: (a: TKey, b: TKey) => number, descending: boolean, next?: BaseEnumerableSorter<TSource>) {
        super();
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
        let result = this.comparer(this.keys[i], this.keys[j]) * this.descending;
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