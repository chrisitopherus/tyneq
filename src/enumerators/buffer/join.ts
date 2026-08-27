import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";
import { Nullable } from "../../types/utility";
import { DefaultingMap } from "../../utility/DefaultingMap";

/**
 * Correlates outer elements with matching inner elements using a key equality comparison.
 *
 * @remarks
 * Deferred. Buffers `innerSource` into a lookup on the first iteration; the outer (source)
 * sequence itself streams - each outer element is pulled one at a time and matched against
 * the already-built inner lookup.
 *
 * @see {@link TyneqSequence.join}
 * @group Operators
 * @category Buffering
 * @internal
 */
export class JoinEnumerator<TOuter, TInner, TKey, TResult> extends TyneqEnumerator<TOuter, TResult> {
    private readonly innerSource: Iterable<TInner>;
    private readonly outerKeySelector: (outer: TOuter) => TKey;
    private readonly innerKeySelector: (inner: TInner) => TKey;
    private readonly resultSelector: (outer: TOuter, inner: TInner) => TResult;
    private innerLookup = new DefaultingMap<TKey, TInner[]>();
    private pendingOuter!: TOuter;
    private pendingMatches: Nullable<TInner[]> = null;
    private pendingIndex = 0;

    public constructor(
        sourceEnumerator: Enumerator<TOuter>,
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