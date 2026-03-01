import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { UnionByEnumerator } from "../../enumerators/buffer/unionBy";
import { IEnumerable, IEnumerator, IteratorFactory } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

/**
 * Operator implementation for set union operation based on key selector.
 * 
 * @remarks
 * This is a buffering operator that returns elements with distinct keys from both sequences.
 * For duplicate keys, the first occurrence (from source, then other) is kept. Delegates
 * enumeration logic to {@link UnionByEnumerator}.
 * 
 * **Performance**: O(n + m) time where n is source length and m is other values length.
 * O(n + m) space to deduplicate by key using a hash set.
 * 
 * **Operator Category**: Buffering - builds a hash set of all unique keys before yielding.
 * 
 * @typeParam TSource - The type of elements in the sequences.
 * @typeParam TKey - The type of keys used for distinctness comparison.
 * 
 * @see {@link UnionByEnumerator} for the enumeration implementation.
 * @see {@link ITyneqEnumerable.unionBy} for the public API.
 */
export class UnionByOperatorEnumerable<TSource, TKey> extends TyneqOperatorEnumerable<TSource> {
    /** The second sequence to union with the source. */
    private readonly otherValues: Iterable<TSource>;
    /** Function to extract comparison keys from elements. */
    private readonly keySelector: (item: TSource) => TKey;

    /**
     * Creates a new set union by key operator.
     * 
     * @param source - The source sequence.
     * @param otherValues - The second sequence to union with.
     * @param keySelector - Function to extract keys for distinctness comparison.
     * 
     * @throws {@link ArgumentError} when `otherValues` or `keySelector` is undefined.
     * @throws {@link ArgumentNullError} when `otherValues` or `keySelector` is null.
     */
    public constructor(source: IEnumerable<TSource>, otherValues: Iterable<TSource>, keySelector: (item: TSource) => TKey) {
        super(source);

        this.otherValues = otherValues;
        this.keySelector = keySelector;
    }

    public override getEnumerator(): IEnumerator<TSource> {
        return new UnionByEnumerator<TSource, TKey>(this.source[Symbol.iterator](), this.otherValues, this.keySelector);
    }
}