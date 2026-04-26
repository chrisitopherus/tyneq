import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator, TyneqSequence } from "../../types/core";
import { ArgumentUtility } from "../../utility/ArgumentUtility";
import { DefaultingMap } from "../../utility/DefaultingMap";

/**
 * Correlates outer elements with groups of matching inner elements.
 *
 * @remarks
 * Deferred. Source is fully buffered on the first iteration of the returned sequence.
 *
 * @see {@link TyneqSequence.groupJoin}
 * @group Operators
 * @category Buffering
 * @internal
 */
export class GroupJoinEnumerator<TOuter, TInner, TKey, TResult> extends TyneqEnumerator<TOuter, TResult> {
    private readonly innerSource: Iterable<TInner>;
    private readonly outerKeySelector: (outer: TOuter) => TKey;
    private readonly innerKeySelector: (inner: TInner) => TKey;
    private readonly resultSelector: (outer: TOuter, group: TyneqSequence<TInner>) => TResult;
    private readonly groupFactory: (values: TInner[]) => TyneqSequence<TInner>;
    private innerLookup = new DefaultingMap<TKey, TInner[]>();

    
    public constructor(
        sourceEnumerator: Enumerator<TOuter>,
        innerSource: Iterable<TInner>,
        outerKeySelector: (outer: TOuter) => TKey,
        innerKeySelector: (inner: TInner) => TKey,
        resultSelector: (outer: TOuter, group: TyneqSequence<TInner>) => TResult,
        groupFactory: (values: TInner[]) => TyneqSequence<TInner>
    ) {
        super(sourceEnumerator);
        this.innerSource = innerSource;
        this.outerKeySelector = outerKeySelector;
        this.innerKeySelector = innerKeySelector;
        this.resultSelector = resultSelector;
        this.groupFactory = groupFactory;
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

        const resultItem = this.resultSelector(outerItem, this.groupFactory(innerItems));
        return this.yield(resultItem);
    }
}