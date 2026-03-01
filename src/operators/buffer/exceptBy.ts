import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { ExceptByEnumerator } from "../../enumerators/buffer/exceptBy";
import { IEnumerable, IEnumerator, IteratorFactory } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

/**
 * Operator implementation for set difference operation based on key selector.
 * 
 * @remarks
 * This is a buffering operator that returns elements from the source sequence whose
 * extracted keys do not appear in the excluded keys sequence. Delegates the actual
 * enumeration logic to {@link ExceptByEnumerator}.
 * 
 * **Performance**: O(n + m) time where n is source length and m is excluded keys length.
 * O(m) space to index the excluded keys in a hash set.
 * 
 * **Operator Category**: Buffering - builds a hash set of excluded keys before yielding.
 * 
 * @typeParam TSource - The type of elements in the source sequence.
 * @typeParam TKey - The type of keys used for comparison.
 * 
 * @see {@link ExceptByEnumerator} for the enumeration implementation.
 * @see {@link ITyneqEnumerable.exceptBy} for the public API.
 */
export class ExceptByOperatorEnumerable<TSource, TKey> extends TyneqOperatorEnumerable<TSource> {
    /** Sequence of keys to exclude. */
    private readonly excludedKeys: Iterable<TKey>;
    /** Function to extract keys from source elements. */
    private readonly keySelector: (item: TSource) => TKey;

    /**
     * Creates a new set difference by key operator.
     * 
     * @param source - The source sequence.
     * @param excludedKeys - Sequence of keys to exclude.
     * @param keySelector - Function to extract keys from source elements.
     * 
     * @throws {@link ArgumentError} when `excludedKeys` or `keySelector` is undefined.
     * @throws {@link ArgumentNullError} when `excludedKeys` or `keySelector` is null.
     */
    public constructor(source: IEnumerable<TSource>, excludedKeys: Iterable<TKey>, keySelector: (item: TSource) => TKey) {
        super(source);

        this.excludedKeys = excludedKeys;
        this.keySelector = keySelector;
    }

    /**
     * Returns a factory function that creates fresh enumerators for this operation.
     * 
     * @remarks
     * The factory captures the source, excluded keys, and key selector, returning a
     * function that produces {@link ExceptByEnumerator} instances. Each enumerator
     * maintains independent state.
     * 
     * @returns A factory function producing except-by-key enumerators.
     */
    public getFactory(): IteratorFactory<TSource> {
        const source = this.source;
        const excludedKeys = this.excludedKeys;
        const keySelector = this.keySelector;

        return () => {
            return new ExceptByEnumerator<TSource, TKey>(source[Symbol.iterator](), excludedKeys, keySelector);
        }
    }

    /**
     * Creates a new enumerator for set difference by key enumeration.
     * 
     * @remarks
     * Delegates to {@link ExceptByEnumerator} which builds a hash set of excluded keys
     * and yields only source elements whose keys are not in that set.
     * 
     * @returns A new enumerator positioned before the first element.
     */
    public override getEnumerator(): IEnumerator<TSource> {
        return new ExceptByEnumerator<TSource, TKey>(this.source[Symbol.iterator](), this.excludedKeys, this.keySelector);
    }
}