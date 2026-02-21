import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { JoinEnumerator } from "../../enumerators/buffer/join";
import { IEnumerable, IEnumerator, IteratorFactory } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

/**
 * Operator implementation for inner join operation.
 * 
 * @remarks
 * This is a buffering operator that correlates elements of two sequences based on matching
 * keys. For each pair of matching elements (by key), applies the result selector to produce
 * an output element. Delegates enumeration logic to {@link JoinEnumerator}.
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
 * @see {@link JoinEnumerator} for the enumeration implementation.
 * @see {@link ITyneqEnumerable.join} for the public API.
 */
export class JoinOperatorEnumerable<TSource, TInner, TKey, TResult> extends TyneqOperatorEnumerable<TSource, TResult> {
    /** The inner sequence to join with. */
    private readonly inner: Iterable<TInner>;
    /** Function to extract keys from outer elements. */
    private readonly outerKeySelector: (outer: TSource) => TKey
    /** Function to extract keys from inner elements. */
    private readonly innerKeySelector: (inner: TInner) => TKey;
    /** Function to transform matching outer and inner elements into result. */
    private readonly resultSelector: (outer: TSource, inner: TInner) => TResult;

    /**
     * Creates a new inner join operator.
     * 
     * @param source - The outer sequence.
     * @param inner - The inner sequence to join with.
     * @param outerKeySelector - Function to extract keys from outer elements.
     * @param innerKeySelector - Function to extract keys from inner elements.
     * @param resultSelector - Function to create results from matching pairs.
     * 
     * @throws {@link ArgumentError} when any parameter is undefined.
     * @throws {@link ArgumentNullError} when any parameter is null.
     */
    public constructor(
        source: IEnumerable<TSource>,
        inner: Iterable<TInner>,
        outerKeySelector: (outer: TSource) => TKey,
        innerKeySelector: (inner: TInner) => TKey,
        resultSelector: (outer: TSource, inner: TInner) => TResult
    ) {
        super(source);
        ArgumentUtility.checkNotOptional(inner, nameof({ inner }));
        ArgumentUtility.checkIterable(inner, nameof({ inner }));
        ArgumentUtility.checkNotOptional(outerKeySelector, nameof({ outerKeySelector }));
        ArgumentUtility.checkNotOptional(innerKeySelector, nameof({ innerKeySelector }));
        ArgumentUtility.checkNotOptional(resultSelector, nameof({ resultSelector }));

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
            return new JoinEnumerator<TSource, TInner, TKey, TResult>(source[Symbol.iterator](), innerSource, outerKeySelector, innerKeySelector, resultSelector);
        }
    }

    public override getEnumerator(): IEnumerator<TResult> {
        return new JoinEnumerator<TSource, TInner, TKey, TResult>(
            this.source[Symbol.iterator](),
            this.inner,
            this.outerKeySelector,
            this.innerKeySelector,
            this.resultSelector
        );
    }
}