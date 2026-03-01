import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { GroupJoinEnumerator } from "../../enumerators/buffer/groupJoin";
import { IEnumerable, IEnumerator, IteratorFactory, ITyneqEnumerable } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

/**
 * Operator implementation for left outer join with grouping (group-join).
 * 
 * @remarks
 * This is a buffering operator that correlates elements of two sequences based on keys
 * and groups matching inner elements. For each outer element, all matching inner elements
 * (by key) are grouped together. Delegates enumeration logic to {@link GroupJoinEnumerator}.
 * 
 * **Performance**: O(n + m) time where n is outer length and m is inner length.
 * O(m) space to index the inner sequence by key.
 * 
 * **Operator Category**: Buffering - indexes inner sequence before yielding results.
 * 
 * @typeParam TSource - The type of elements in the outer (source) sequence.
 * @typeParam TInner - The type of elements in the inner sequence.
 * @typeParam TKey - The type of keys used for correlation.
 * @typeParam TResult - The type of result elements.
 * 
 * @see {@link GroupJoinEnumerator} for the enumeration implementation.
 * @see {@link ITyneqEnumerable.groupJoin} for the public API.
 */
export class GroupJoinOperatorEnumerable<TSource, TInner, TKey, TResult> extends TyneqOperatorEnumerable<TSource, TResult> {
    /** The inner sequence to join with. */
    private readonly inner: Iterable<TInner>;
    /** Function to extract keys from outer elements. */
    private readonly outerKeySelector: (outer: TSource) => TKey
    /** Function to extract keys from inner elements. */
    private readonly innerKeySelector: (inner: TInner) => TKey;
    /** Function to transform outer element and grouped inner elements into result. */
    private readonly resultSelector: (outer: TSource, group: ITyneqEnumerable<TInner>) => TResult;

    /**
     * Creates a new group-join operator.
     * 
     * @param source - The outer sequence.
     * @param inner - The inner sequence to join with.
     * @param outerKeySelector - Function to extract keys from outer elements.
     * @param innerKeySelector - Function to extract keys from inner elements.
     * @param resultSelector - Function to create results from outer element and group.
     * 
     * @throws {@link ArgumentError} when any parameter is undefined.
     * @throws {@link ArgumentNullError} when any parameter is null.
     */
    public constructor(
        source: IEnumerable<TSource>,
        inner: Iterable<TInner>,
        outerKeySelector: (outer: TSource) => TKey,
        innerKeySelector: (inner: TInner) => TKey,
        resultSelector: (outer: TSource, group: ITyneqEnumerable<TInner>) => TResult
    ) {
        super(source);

        this.inner = inner;
        this.outerKeySelector = outerKeySelector;
        this.innerKeySelector = innerKeySelector;
        this.resultSelector = resultSelector;
    }

    public getFactory(): IteratorFactory<TResult> {
        const source = this.source;
        const innerSource = this.inner;
        const outerKeySelector = this.outerKeySelector;
        const innerKeySelector = this.innerKeySelector;
        const resultSelector = this.resultSelector;
        return () => {
            return new GroupJoinEnumerator<TSource, TInner, TKey, TResult>(source[Symbol.iterator](), innerSource, outerKeySelector, innerKeySelector, resultSelector);
        }
    }

    public override getEnumerator(): IEnumerator<TResult> {
        return new GroupJoinEnumerator<TSource, TInner, TKey, TResult>(
            this.source[Symbol.iterator](),
            this.inner,
            this.outerKeySelector,
            this.innerKeySelector,
            this.resultSelector
        );
    }
}