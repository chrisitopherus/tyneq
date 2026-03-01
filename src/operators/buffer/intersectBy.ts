import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { IntersectByEnumerator } from "../../enumerators/buffer/intersectBy";
import { IEnumerable, IEnumerator, IteratorFactory } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

/**
 * Operator implementation for set intersection based on key selector.
 * 
 * @remarks
 * This is a buffering operator that returns elements from the source whose extracted keys
 * appear in the intersected keys sequence. Delegates enumeration logic to
 * {@link IntersectByEnumerator}.
 * 
 * **Performance**: O(n + m) time where n is source length and m is intersected keys length.
 * O(m) space to index the intersected keys in a hash set.
 * 
 * **Operator Category**: Buffering - builds a hash set of intersected keys before yielding.
 * 
 * @typeParam TSource - The type of elements in the source sequence.
 * @typeParam TKey - The type of keys used for intersection.
 * 
 * @see {@link IntersectByEnumerator} for the enumeration implementation.
 * @see {@link ITyneqEnumerable.intersectBy} for the public API.
 */
export class IntersectByOperatorEnumerable<TSource, TKey> extends TyneqOperatorEnumerable<TSource> {
    /** Function to extract keys from source elements. */
    private readonly keySelector: (item: TSource) => TKey;
    /** Sequence of keys that must be matched. */
    private readonly intersectedKeys: Iterable<TKey>;

    /**
     * Creates a new set intersection by key operator.
     * 
     * @param source - The source sequence.
     * @param intersectedKeys - Sequence of keys to intersect with.
     * @param keySelector - Function to extract keys from source elements.
     * 
     * @throws {@link ArgumentError} when `intersectedKeys` or `keySelector` is undefined.
     * @throws {@link ArgumentNullError} when `intersectedKeys` or `keySelector` is null.
     */
    public constructor(source: IEnumerable<TSource>, intersectedKeys: Iterable<TKey>, keySelector: (item: TSource) => TKey) {
        super(source);

        this.intersectedKeys = intersectedKeys;
        this.keySelector = keySelector;
    }

    public override getEnumerator(): IEnumerator<TSource> {
        return new IntersectByEnumerator<TSource, TKey>(
            this.source[Symbol.iterator](),
            this.intersectedKeys,
            this.keySelector
        );
    }
}