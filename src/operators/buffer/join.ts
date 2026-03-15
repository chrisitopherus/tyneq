import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from '../../types/core';
import { operator } from '../../extensibility/operatorDecorators';
import { Nullable } from "../../types/utility";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { TyneqMap } from "../../utility/map";

/**
 * Enumerator that correlates elements from two sequences based on matching keys (inner join).
 *
 * @remarks
 * Deferred. Source is not enumerated until iteration begins.
 *
 * Buffers the entire inner sequence into a key-to-values lookup on first iteration. For each
 * outer element, yields one result per matching inner element. Outer elements with no matches
 * are skipped.
 *
 * @group Enumerators
 * @internal
 */
@operator<[innerSource: unknown, outerKeySelector: unknown, innerKeySelector: unknown, resultSelector: unknown]>('join', (innerSource, outerKeySelector, innerKeySelector, resultSelector) => {
    ArgumentUtility.checkNotOptional({ innerSource });
    ArgumentUtility.checkIterable({ innerSource });
    ArgumentUtility.checkNotOptional({ outerKeySelector });
    ArgumentUtility.checkNotOptional({ innerKeySelector });
    ArgumentUtility.checkNotOptional({ resultSelector });
})
export class JoinEnumerator<TOuter, TInner, TKey, TResult> extends TyneqEnumerator<TOuter, TResult> {
    private readonly innerSource: Iterable<TInner>;
    private readonly outerKeySelector: (outer: TOuter) => TKey;
    private readonly innerKeySelector: (inner: TInner) => TKey;
    private readonly resultSelector: (outer: TOuter, inner: TInner) => TResult;
    private innerLookup = new TyneqMap<TKey, TInner[]>();
    private pendingOuter!: TOuter;
    private pendingMatches: Nullable<TInner[]> = null;
    private pendingIndex = 0;

    /**
     * @param sourceEnumerator - The outer sequence enumerator.
     * @param innerSource - The inner sequence to join against; fully buffered on first iteration.
     * @param outerKeySelector - Extracts the join key from each outer element.
     * @param innerKeySelector - Extracts the join key from each inner element.
     * @param resultSelector - Combines a matching outer and inner element into a result.
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
