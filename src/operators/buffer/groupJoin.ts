import { TyneqSourceEnumerator } from "../../core/enumerators/TyneqSourceEnumerator";
import { IEnumerator, ITyneqEnumerable } from "../../types/core";
import { operator } from "../../extensibility/operator";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { TyneqMap } from "../../utility/map";
import { Tyneq } from "../../core/tyneq";

/**
 * Enumerator that correlates outer elements with inner groups via matching keys (left outer join).
 *
 * @remarks
 * Deferred. Source is not enumerated until iteration begins.
 *
 * Buffers the entire inner sequence into a key-to-values lookup on first iteration. Each outer
 * element is then paired with an enumerable of all matching inner elements (empty if no matches).
 *
 * @group Enumerators
 * @internal
 */
@operator<[innerSource: unknown, outerKeySelector: unknown, innerKeySelector: unknown, resultSelector: unknown]>("groupJoin", "buffer", (innerSource, outerKeySelector, innerKeySelector, resultSelector) => {
    ArgumentUtility.checkNotOptional({ innerSource });
    ArgumentUtility.checkIterable({ innerSource });
    ArgumentUtility.checkNotOptional({ outerKeySelector });
    ArgumentUtility.checkNotOptional({ innerKeySelector });
    ArgumentUtility.checkNotOptional({ resultSelector });
})
export class GroupJoinEnumerator<TOuter, TInner, TKey, TResult> extends TyneqSourceEnumerator<TOuter, TResult> {
    private readonly innerSource: Iterable<TInner>;
    private readonly outerKeySelector: (outer: TOuter) => TKey;
    private readonly innerKeySelector: (inner: TInner) => TKey;
    private readonly resultSelector: (outer: TOuter, group: ITyneqEnumerable<TInner>) => TResult;
    private innerLookup = new TyneqMap<TKey, TInner[]>();

    /**
     * @param sourceEnumerator - The outer sequence enumerator.
     * @param innerSource - The inner sequence to join against; fully buffered on first iteration.
     * @param outerKeySelector - Extracts the join key from each outer element.
     * @param innerKeySelector - Extracts the join key from each inner element.
     * @param resultSelector - Combines an outer element with its matching inner group.
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
