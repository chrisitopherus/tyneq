import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator, IEnumerable } from '../../types/core';
import { Nullable } from "../../types/utility";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { TyneqMap } from "../../utility/map";
import { nameof } from "../../utility/nameof";

/**
 * Enumerator implementation for correlating elements from two sequences based on matching keys.
 * 
 * @remarks
 * This enumerator performs an inner join between outer and inner sequences based on matching keys.
 * Lazily builds a lookup from the inner sequence on first iteration, then yields a result for
 * each outer-inner pair with matching keys. Handles one-to-many relationships (one outer can
 * match multiple inner elements).
 * 
 * **Implementation**: Buffers entire inner sequence into a key-to-values lookup on first call.
 * Maintains pending state for outer elements with multiple inner matches.
 * 
 * **Performance**: O(m) space where m is size of inner sequence. O(m) time for initial
 * inner sequence consumption, then O(k) per outer element where k is matches.
 * 
 * @typeParam TOuter - The type of elements in the outer (source) sequence.
 * @typeParam TInner - The type of elements in the inner sequence.
 * @typeParam TKey - The type of the join key.
 * @typeParam TResult - The type of the result after applying result selector.
 * 
 * @see {@link JoinOperatorEnumerable} for the operator that uses this enumerator.
 */
export class JoinEnumerator<TOuter, TInner, TKey, TResult> extends TyneqEnumerator<TOuter, TResult> {
    /** The inner sequence to join against. */
    private readonly innerSource: Iterable<TInner>;
    /** Function to extract key from outer elements. */
    private readonly outerKeySelector: (outer: TOuter) => TKey;
    /** Function to extract key from inner elements. */
    private readonly innerKeySelector: (inner: TInner) => TKey;
    /** Function to combine outer and inner elements. */
    private readonly resultSelector: (outer: TOuter, inner: TInner) => TResult;
    /** Map from keys to arrays of matching inner elements. */
    private innerLookup = new TyneqMap<TKey, TInner[]>();
    /** Current outer element being processed for multiple inner matches. */
    private pendingOuter!: TOuter;
    /** Array of inner elements matching current outer element. */
    private pendingMatches: Nullable<TInner[]> = null;
    /** Index into pending matches array. */
    private pendingIndex = 0;

    /**
     * Creates a new join enumerator.
     * 
     * @param sourceEnumerator - The outer sequence enumerator.
     * @param innerSource - The inner sequence to join against.
     * @param outerKeySelector - Function to extract key from outer elements.
     * @param innerKeySelector - Function to extract key from inner elements.
     * @param resultSelector - Function to combine outer and inner elements.
     * @throws {ArgumentError} If any required parameter is null or undefined.
     */
    public constructor(
        sourceEnumerator: IEnumerator<TOuter>,
        innerSource: Iterable<TInner>,
        outerKeySelector: (outer: TOuter) => TKey,
        innerKeySelector: (inner: TInner) => TKey,
        resultSelector: (outer: TOuter, inner: TInner) => TResult
    ) {
        super(sourceEnumerator);
        ArgumentUtility.checkNotOptional(innerSource, nameof({ innerSource }));
        ArgumentUtility.checkNotOptional(outerKeySelector, nameof({ outerKeySelector }));
        ArgumentUtility.checkNotOptional(innerKeySelector, nameof({ innerKeySelector }));
        ArgumentUtility.checkNotOptional(resultSelector, nameof({ resultSelector }));

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
     * Gets the next joined result by combining outer and inner elements with matching keys.
     * On first call, consumes entire inner sequence to build lookup.
     * 
     * @returns Iterator result containing the next joined result, or done if exhausted.
     */
    protected override handleNext(): IteratorResult<TResult> {
        while (true) {
            if (this.pendingMatches !== null) {
                if (this.pendingIndex < this.pendingMatches.length) {
                    return this.yield(this.resultSelector(this.pendingOuter, this.pendingMatches[this.pendingIndex++]));
                }

                this.pendingMatches = null;
            }

            const nextOuter = this.sourceEnumerator.next();
            if (nextOuter.done) {
                return this.done();
            }

            const outerItem = nextOuter.value;
            const outerKey = this.outerKeySelector(outerItem);
            const innerItems = this.innerLookup.get(outerKey);

            if (innerItems === undefined || innerItems.length === 0) {
                continue;
            }

            this.pendingOuter = outerItem;
            this.pendingMatches = innerItems;
            this.pendingIndex = 0;
        }
    }
}