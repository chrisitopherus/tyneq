import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { DistinctByEnumerator } from "../../enumerators/buffer/distinctBy";
import { IEnumerable, IEnumerator, IteratorFactory } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

/**
 * Operator implementation for filtering distinct elements by key selector.
 * 
 * @remarks
 * This is a buffering operator that removes duplicate elements based on extracted keys,
 * keeping only the first occurrence of each unique key value. Delegates the actual
 * enumeration logic to {@link DistinctByEnumerator}.
 * 
 * **Performance**: O(n) time, O(n) space. Must buffer all unique keys in a hash set.
 * 
 * **Operator Category**: Buffering - maintains a hash set of seen keys during enumeration.
 * 
 * @typeParam TSource - The type of elements in the sequence.
 * @typeParam TKey - The type of key used for distinctness comparison.
 * 
 * @see {@link DistinctByEnumerator} for the enumeration implementation.
 * @see {@link ITyneqEnumerable.distinctBy} for the public API.
 */
export class DistinctByOperatorEnumerable<TSource, TKey> extends TyneqOperatorEnumerable<TSource> {
    /** Function to extract comparison keys from elements. */
    private readonly keySelector: (item: TSource) => TKey;

    /**
     * Creates a new distinct-by-key operator for the given source sequence.
     * 
     * @param source - The source sequence to filter for distinct elements.
     * @param keySelector - Function to extract keys for distinctness comparison.
     * 
     * @throws {@link ArgumentError} when `keySelector` is undefined.
     * @throws {@link ArgumentNullError} when `keySelector` is null.
     */
    public constructor(source: IEnumerable<TSource>, keySelector: (item: TSource) => TKey) {
        super(source);
        ArgumentUtility.checkNotOptional(keySelector, nameof({ keySelector }));

        this.keySelector = keySelector;
    }

    /**
     * Returns a factory function that creates fresh enumerators for this operation.
     * 
     * @remarks
     * The factory captures the source sequence and key selector, returning a function
     * that produces {@link DistinctByEnumerator} instances. Each enumerator maintains
     * independent state.
     * 
     * @returns A factory function producing distinct-by-key enumerators.
     */
    public getFactory(): IteratorFactory<TSource> {
        const source = this.source;
        const keySelector = this.keySelector;
        return () => {
            return new DistinctByEnumerator<TSource, TKey>(source[Symbol.iterator](), keySelector);
        }
    }

    /**
     * Creates a new enumerator for distinct-by-key enumeration.
     * 
     * @remarks
     * Delegates to {@link DistinctByEnumerator} which maintains a hash set of seen keys
     * and yields only elements with first-encountered key values.
     * 
     * @returns A new enumerator positioned before the first element.
     */
    public override getEnumerator(): IEnumerator<TSource> {
        return new DistinctByEnumerator<TSource, TKey>(this.source[Symbol.iterator](), this.keySelector);
    }
}