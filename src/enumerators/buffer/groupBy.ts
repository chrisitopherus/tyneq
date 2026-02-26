import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from '../../types/core';
import { TyneqMap } from "../../utility/map";
import { TyneqEnumerable } from '../../core/TyneqEnumerable';
import { Tyneq } from "../..";

/**
 * Enumerator implementation for grouping sequence elements by a key.
 * 
 * @remarks
 * This enumerator consumes the entire source sequence on first iteration to build a lookup
 * table grouping elements by key. Applies value and result selectors to transform the output.
 * 
 * **Implementation**: Buffers all source elements into a key-to-values lookup on first call.
 * Then yields transformed groups.
 * 
 * **Performance**: O(n) space for buffering all elements. O(n) time for initial grouping.
 * 
 * @typeParam TSource - The type of elements in the source sequence.
 * @typeParam TKey - The type of the grouping key.
 * @typeParam TValue - The type of elements within each group.
 * @typeParam TResult - The type of the result after applying result selector.
 * 
 * @see {@link GroupByOperatorEnumerable} for the operator that uses this enumerator.
 */
export class GroupByEnumerator<TSource, TKey, TValue, TResult> extends TyneqEnumerator<TSource, TResult> {
    /** Whether source has been consumed and grouped. */
    private initialized = false;
    /** Function to extract grouping key from each element. */
    private readonly keySelector: (item: TSource) => TKey;
    /** Function to transform each element into group value. */
    private readonly valueSelector: (item: TSource) => TValue;
    /** Function to transform key and group into result. */
    private readonly resultSelector: (key: TKey, values: TyneqEnumerable<TValue>) => TResult;
    /** Enumerator over the grouped entries. */
    private lookupEnumerator?: IEnumerator<[TKey, TValue[]]>;
    /** Map from keys to arrays of grouped values. */
    private lookup = new TyneqMap<TKey, TValue[]>();

    /**
     * Creates a new groupBy enumerator.
     * 
     * @param sourceEnumerator - The source enumerator.
     * @param keySelector - Function to extract grouping key from each element.
     * @param valueSelector - Function to transform each element into group value.
     * @param resultSelector - Function to transform key and group into result.
     */
    public constructor(
        sourceEnumerator: IEnumerator<TSource>,
        keySelector: (item: TSource) => TKey,
        valueSelector: (item: TSource) => TValue,
        resultSelector: (key: TKey, values: TyneqEnumerable<TValue>) => TResult
    ) {
        super(sourceEnumerator);
        this.keySelector = keySelector;
        this.valueSelector = valueSelector;
        this.resultSelector = resultSelector;
    }

    /**
     * Gets the next group from the lookup table.
     * On first call, consumes entire source to build groups.
     * 
     * @returns Iterator result containing the next transformed group, or done if exhausted.
     */
    protected override handleNext(): IteratorResult<TResult> {
        if (!this.initialized) {
            while (true) {
                const { done, value } = this.sourceEnumerator.next();
                if (done) {
                    break;
                }

                const key = this.keySelector(value);
                const val = this.valueSelector(value);
                const group = this.lookup.getOrInit(key, () => []);
                group.push(val);
            }

            this.initialized = true;
            this.lookupEnumerator = this.lookup.entries();
        }

        // May throw if not initialized
        if (this.lookupEnumerator === undefined) {
            return this.done();
        }

        const { done, value } = this.lookupEnumerator.next();
        if (done) {
            return this.done();
        }

        const [key, values] = value;
        const result = this.resultSelector(key, Tyneq.from(values));
        return this.yield(result);
    }
}