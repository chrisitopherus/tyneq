import { TyneqEnumerator } from "../../core/TyneqEnumerator";
import { EnumeratorResult, IEnumerator } from '../../types/core';
import { TyneqMap } from "../../utility/map";
import { TyneqEnumerable } from '../../core/TyneqEnumerable';
import { Tyneq } from "../..";

export class GroupByEnumerator<TSource, TKey, TValue, TResult> extends TyneqEnumerator<TSource, TResult> {
    private initialized = false;
    private readonly keySelector: (item: TSource) => TKey;
    private readonly valueSelector: (item: TSource) => TValue;
    private readonly resultSelector: (key: TKey, values: TyneqEnumerable<TValue>) => TResult;
    private lookupEnumerator?: IEnumerator<[TKey, TValue[]]>;

    private lookup = new TyneqMap<TKey, TValue[]>();

    public constructor(
        sourceEnumerator: IEnumerator<TSource>,
        keySelector: (item: TSource) => TKey,
        valueSelector: (item: TSource) => TValue,
        resultSelector: (key: TKey, values: TyneqEnumerable<TValue>) => TResult
    ) {
        super(sourceEnumerator);
        this.keySelector = keySelector;
        this.valueSelector = valueSelector;
        this.resultSelector = resultSelector;
    }

    protected override handleNext(): EnumeratorResult<TResult> {
        if (!this.initialized) {
            while (true) {
                const { done, value } = this.sourceEnumerator.next();
                if (done) {
                    break;
                }

                const key = this.keySelector(value);
                const val = this.valueSelector(value);
                const group = this.lookup.getOrInit(key, () => []);
                group.push(val);
            }

            this.initialized = true;
            this.lookupEnumerator = this.lookup.entries();
        }

        // May throw if not initialized
        if (this.lookupEnumerator === undefined) {
            return this.complete();
        }

        const { done, value } = this.lookupEnumerator.next();
        if (done) {
            return this.complete();
        }

        const [key, values] = value;
        const result = this.resultSelector(key, Tyneq.from(values));
        return this.yield(result);
    }
}