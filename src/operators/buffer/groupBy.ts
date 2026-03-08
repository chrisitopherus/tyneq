import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { GroupByEnumerator } from "../../enumerators/buffer/groupBy";
import { IEnumerable, IEnumerator, IteratorFactory, ITyneqEnumerable } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";
import { operator } from "../../extensibility/operatorDecorators";

/**
 * Operator implementation for grouping elements by key with value projection.
 * 
 * @remarks
 * This is a buffering operator that groups elements by key, projects values, and applies
 * a result selector to each group. Delegates the actual enumeration logic to
 * {@link GroupByEnumerator}.
 * 
 * **Performance**: O(n) time, O(n) space. Must buffer all elements to form groups.
 * 
 * **Operator Category**: Buffering - materializes all elements into groups before yielding.
 *
 * **Registration method**: TC39 `@operator()` class decorator.
 *
 * This method uses deferred execution. The source sequence is fully buffered on first iteration of the returned sequence.
 *
 * @typeParam TSource - The type of elements in the source sequence.
 * @typeParam TKey - The type of grouping key.
 * @typeParam TValue - The type of projected values within each group.
 * @typeParam TResult - The type of result elements after applying result selector.
 *
 * @see {@link GroupByEnumerator} for the enumeration implementation.
 * @see {@link ITyneqEnumerable.groupBy} for the public API.
 *
 * @group Operators
 * @category Buffering
 * @internal
 */
@operator('groupBy')
export class GroupByOperatorEnumerable<TSource, TKey, TValue, TResult> extends TyneqOperatorEnumerable<TSource, TResult> {
    /** Function to extract grouping keys from source elements. */
    private readonly keySelector: (item: TSource) => TKey;
    /** Function to project source elements to group values. */
    private readonly valueSelector: (item: TSource) => TValue;
    /** Function to transform each group into a result element. */
    private readonly resultSelector: (key: TKey, values: ITyneqEnumerable<TValue>) => TResult;

    /**
     * Creates a new group-by operator.
     * 
     * @param source - The source sequence.
     * @param keySelector - Function to extract grouping keys.
     * @param valueSelector - Function to project values within each group.
     * @param resultSelector - Function to transform each group into a result.
     * 
     * @throws {@link ArgumentError} when any selector is undefined.
     * @throws {@link ArgumentNullError} when any selector is null.
     */
    public constructor(
        source: IEnumerable<TSource>,
        keySelector: (item: TSource) => TKey,
        valueSelector: (item: TSource) => TValue,
        resultSelector: (key: TKey, values: ITyneqEnumerable<TValue>) => TResult
    ) {
        super(source);

        this.keySelector = keySelector;
        this.valueSelector = valueSelector;
        this.resultSelector = resultSelector;
    }

    public getFactory(): IteratorFactory<TResult> {
        const source = this.source;
        const keySelector = this.keySelector;
        const valueSelector = this.valueSelector;
        const resultSelector = this.resultSelector;

        return () => {
            return new GroupByEnumerator<TSource, TKey, TValue, TResult>(
                source[Symbol.iterator](),
                keySelector,
                valueSelector,
                resultSelector
            );
        }
    }

    public override getEnumerator(): IEnumerator<TResult> {
        return new GroupByEnumerator<TSource, TKey, TValue, TResult>(
            this.source[Symbol.iterator](),
            this.keySelector,
            this.valueSelector,
            this.resultSelector
        );
    }
}