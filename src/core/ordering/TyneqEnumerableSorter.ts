import { Nullable } from "../../types/utility";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";
import { BaseEnumerableSorter } from "./BaseEnumerableSorter";

/**
 * Concrete sorter implementation for a single sort criterion.
 *
 * @remarks
 * Extracts keys once via `keySelector`, caches them, then compares elements using
 * `comparer`. The `descending` flag inverts results. For multi-level sorts, sorter instances
 * are linked via `next`; when two elements are equal at this level, comparison delegates to
 * the next sorter. The last sorter in the chain calls {@link stabilityCompare} to preserve
 * original order.
 *
 * @typeParam TSource - The type of elements being sorted.
 * @typeParam TKey - The type of the sort key extracted by `keySelector`.
 *
 * @see {@link BaseEnumerableSorter} for the abstract contract.
 * @see {@link TyneqOrderedEnumerable} which creates instances of this sorter.
 *
 * @group Classes
 * @internal
 */
export class TyneqEnumerableSorter<TSource, TKey> extends BaseEnumerableSorter<TSource> {
    private keys: TKey[] = [];
    private readonly keySelector: (item: TSource) => TKey;
    private readonly comparer: (a: TKey, b: TKey) => number;
    private readonly descending: number;
    private next: Nullable<BaseEnumerableSorter<TSource>> = null;

    /**
     * @param keySelector - Extracts the sort key from each element. Must not be null or undefined.
     * @param comparer - Compares two keys. Must not be null or undefined.
     * @param descending - `true` to sort in descending order.
     * @param next - Optional next sorter for multi-level sort chaining.
     *
     * @throws {ArgumentError} When `keySelector` or `comparer` is undefined.
     */
    public constructor(keySelector: (item: TSource) => TKey, comparer: (a: TKey, b: TKey) => number, descending: boolean, next?: BaseEnumerableSorter<TSource>) {
        super();
        ArgumentUtility.checkNotOptional({ keySelector });
        ArgumentUtility.checkNotOptional({ comparer });

        this.keySelector = keySelector;
        this.comparer = comparer;
        this.descending = descending ? -1 : 1;
        this.next = next ?? null;
    }

    /**
     * Extracts a key for each element and caches them. Also chains to the next sorter.
     *
     * @param source - Array of source elements (a copy; not modified).
     * @param count - Number of elements to process.
     */
    public override computeKeys(source: TSource[], count: number): void {
        this.keys = new Array<TKey>(count);
        for (let i = 0; i < count; i++) {
            this.keys[i] = this.keySelector(source[i]);
        }

        this.next?.computeKeys(source, count);
    }

    /**
     * Compares two elements by their cached keys.
     *
     * @remarks
     * Applies the comparator to cached keys, multiplied by the descending factor. If equal,
     * delegates to the next sorter; if no next sorter exists, calls {@link stabilityCompare}.
     *
     * @param i - Original index of the first element.
     * @param j - Original index of the second element.
     */
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

    /**
     * Returns `i - j` to preserve original order for elements with equal keys at all levels.
     *
     * @param i - Original index of the first element.
     * @param j - Original index of the second element.
     */
    protected stabilityCompare(i: number, j: number): number {
        return i - j;
    }
}
