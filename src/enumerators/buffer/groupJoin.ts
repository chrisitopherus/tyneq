import { Tyneq } from "../../core/tyneq";
import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator, ITyneqEnumerable } from '../../types/core';
import { ArgumentUtility } from "../../utility/argumentUtility";
import { TyneqMap } from "../../utility/map";
import { nameof } from "../../utility/nameof";

/**
 * Enumerator implementation for correlating outer elements with inner groups via keys.
 * 
 * @remarks
 * This enumerator performs a left outer join where each outer element is paired with all
 * matching inner elements (grouped by key). Lazily builds a lookup from the inner sequence
 * on first iteration, then joins each outer element with its matching inner group.
 * 
 * **Implementation**: Buffers entire inner sequence into a key-to-values lookup on first call.
 * 
 * **Performance**: O(m) space where m is size of inner sequence. O(m) time for initial
 * inner sequence consumption, then O(1) per outer element.
 * 
 * @typeParam TOuter - The type of elements in the outer (source) sequence.
 * @typeParam TInner - The type of elements in the inner sequence.
 * @typeParam TKey - The type of the join key.
 * @typeParam TResult - The type of the result after applying result selector.
 * 
 * @see {@link GroupJoinOperatorEnumerable} for the operator that uses this enumerator.
 */
export class GroupJoinEnumerator<TOuter, TInner, TKey, TResult> extends TyneqEnumerator<TOuter, TResult> {
    /** The inner sequence to join against. */
    private readonly innerSource: Iterable<TInner>;
    /** Function to extract key from outer elements. */
    private readonly outerKeySelector: (outer: TOuter) => TKey;
    /** Function to extract key from inner elements. */
    private readonly innerKeySelector: (inner: TInner) => TKey;
    /** Function to combine outer element with matching inner group. */
    private readonly resultSelector: (outer: TOuter, group: ITyneqEnumerable<TInner>) => TResult;
    /** Map from keys to arrays of matching inner elements. */
    private innerLookup = new TyneqMap<TKey, TInner[]>();

    /**
     * Creates a new groupJoin enumerator.
     * 
     * @param sourceEnumerator - The outer sequence enumerator.
     * @param innerSource - The inner sequence to join against.
     * @param outerKeySelector - Function to extract key from outer elements.
     * @param innerKeySelector - Function to extract key from inner elements.
     * @param resultSelector - Function to combine outer element with matching inner group.
     * @throws {ArgumentError} If any required parameter is null or undefined.
     */
    public constructor(
        sourceEnumerator: IEnumerator<TOuter>,
        innerSource: Iterable<TInner>,
        outerKeySelector: (outer: TOuter) => TKey,
        innerKeySelector: (inner: TInner) => TKey,
        resultSelector: (outer: TOuter, group: ITyneqEnumerable<TInner>) => TResult
    ) {
        super(sourceEnumerator);
        ArgumentUtility.checkNotOptional({ innerSource });
        ArgumentUtility.checkIterable({ innerSource });
        ArgumentUtility.checkNotOptional({ outerKeySelector });
        ArgumentUtility.checkNotOptional({ innerKeySelector });
        ArgumentUtility.checkNotOptional({ resultSelector });

        this.innerSource = innerSource;
        this.outerKeySelector = outerKeySelector;
        this.innerKeySelector = innerKeySelector;
        this.resultSelector = resultSelector;
    }

    protected override initialize(): void {
        for (const innerItem of this.innerSource) {
            const key = this.innerKeySelector(innerItem);
            const bucket = this.innerLookup.getOrInit(key, () => []);
            bucket.push(innerItem);
        }
    }

    /**
     * Gets the next joined result by combining outer element with matching inner group.
     * On first call, consumes entire inner sequence to build lookup.
     * 
     * @returns Iterator result containing the next joined result, or done if exhausted.
     */
    protected override handleNext(): IteratorResult<TResult> {
        const { done, value: outerItem } = this.sourceEnumerator.next();
        if (done) {
            return this.done();
        }

        const outerKey = this.outerKeySelector(outerItem);
        const innerItems = this.innerLookup.get(outerKey) ?? [];

        const resultItem = this.resultSelector(outerItem, Tyneq.from(innerItems));
        return this.yield(resultItem);
    }
}