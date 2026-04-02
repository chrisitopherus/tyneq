import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator, TyneqSequence } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { TyneqMap } from "../../utility/map";

/**
 * Groups elements by a key selector and projects each group through a result selector.
 *
 * @remarks
 * Deferred. Source is fully buffered on the first iteration of the returned sequence.
 *
 * @see {@link TyneqSequence.groupBy}
 * @group Operators
 * @category Buffering
 * @internal
 */
export class GroupByEnumerator<TSource, TKey, TValue, TResult> extends TyneqEnumerator<TSource, TResult> {
    private readonly keySelector: (item: TSource) => TKey;
    private readonly valueSelector: (item: TSource) => TValue;
    private readonly resultSelector: (key: TKey, values: TyneqSequence<TValue>) => TResult;
    private readonly groupFactory: (values: TValue[]) => TyneqSequence<TValue>;
    private lookupEnumerator?: Enumerator<[TKey, TValue[]]>;
    private lookup = new TyneqMap<TKey, TValue[]>();

    
    public constructor(
        sourceEnumerator: Enumerator<TSource>,
        keySelector: (item: TSource) => TKey,
        valueSelector: (item: TSource) => TValue,
        resultSelector: (key: TKey, values: TyneqSequence<TValue>) => TResult,
        groupFactory: (values: TValue[]) => TyneqSequence<TValue>
    ) {
        super(sourceEnumerator);
        this.keySelector = keySelector;
        this.valueSelector = valueSelector;
        this.resultSelector = resultSelector;
        this.groupFactory = groupFactory;
    }

    protected override initialize(): void {
        while (true) {
            const { done, value } = this.sourceEnumerator.next();
            if (done) {
                break;
            }

            const key = this.keySelector(value);
            const mappedValue = this.valueSelector(value);
            const group = this.lookup.getOrInit(key, () => []);
            group.push(mappedValue);
        }

        this.lookupEnumerator = this.lookup.entries();
    }

    protected override handleNext(): IteratorResult<TResult> {
        if (this.lookupEnumerator === undefined) {
            return this.done();
        }

        const { done, value } = this.lookupEnumerator.next();
        if (done) {
            return this.done();
        }

        const [key, values] = value;
        const result = this.resultSelector(key, this.groupFactory(values));
        return this.yield(result);
    }
}