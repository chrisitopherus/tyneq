import { TyneqEnumerator } from "../../core/TyneqEnumerator";
import { IEnumerator, IEnumerable } from '../../types/core';
import { Nullable } from "../../types/utility";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { TyneqMap } from "../../utility/map";
import { nameof } from "../../utility/nameof";

export class JoinEnumerator<TOuter, TInner, TKey, TResult> extends TyneqEnumerator<TOuter, TResult> {
    private readonly innerSource: IEnumerable<TInner>;
    private readonly outerKeySelector: (outer: TOuter) => TKey;
    private readonly innerKeySelector: (inner: TInner) => TKey;
    private readonly resultSelector: (outer: TOuter, inner: TInner) => TResult;

    private isInitialized = false;
    private innerLookup = new TyneqMap<TKey, TInner[]>();
    
    private pendingOuter!: TOuter;
    private pendingMatches: Nullable<TInner[]> = null;
    private pendingIndex = 0;

    public constructor(
        sourceEnumerator: IEnumerator<TOuter>,
        innerSource: IEnumerable<TInner>,
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

    protected handleNext(): IteratorResult<TResult> {
        this.ensureInitialized();

        while (true) {


            if (this.pendingMatches !== null) {
                if (this.pendingIndex < this.pendingMatches.length) {
                    return this.yield(this.resultSelector(this.pendingOuter, this.pendingMatches[this.pendingIndex++]));
                }

                this.pendingMatches = null;
            }

            const nextOuter = this.sourceEnumerator.next();
            if (nextOuter.done) {
                return this.complete();
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

    private ensureInitialized(): void {
        if (this.isInitialized) return;

        for (const innerItem of this.innerSource) {
            const key = this.innerKeySelector(innerItem);
            const bucket = this.innerLookup.getOrInit(key, () => []);
            bucket.push(innerItem);
        }

        this.isInitialized = true;
    }
}