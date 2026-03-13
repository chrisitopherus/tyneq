import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from '../../types/core';
import { operator } from '../../extensibility/operatorDecorators';
import { TyneqMap } from "../../utility/map";
import { TyneqEnumerable } from '../../core/TyneqEnumerable';
import { Tyneq } from "../..";

/**
 * Enumerator that groups sequence elements by a key.
 *
 * @remarks
 * This method uses deferred execution. The source sequence is fully buffered on first iteration of the returned sequence.
 *
 * Consumes the entire source on first iteration to build a key-to-values lookup, then yields
 * one transformed group per distinct key via the result selector.
 *
 * @typeParam TSource - The type of elements in the source sequence.
 * @typeParam TKey - The type of the grouping key.
 * @typeParam TValue - The type of elements within each group.
 * @typeParam TResult - The type of the result produced by the result selector.
 *
 * @group Enumerators
 * @internal
 */
@operator('groupBy')
export class GroupByEnumerator<TSource, TKey, TValue, TResult> extends TyneqEnumerator<TSource, TResult> {
    private readonly keySelector: (item: TSource) => TKey;
    private readonly valueSelector: (item: TSource) => TValue;
    private readonly resultSelector: (key: TKey, values: TyneqEnumerable<TValue>) => TResult;
    private lookupEnumerator?: IEnumerator<[TKey, TValue[]]>;
    private lookup = new TyneqMap<TKey, TValue[]>();

    /**
     * @param sourceEnumerator - The upstream enumerator to wrap.
     * @param keySelector - Extracts the grouping key from each element.
     * @param valueSelector - Transforms each element into the group element type.
     * @param resultSelector - Combines a key and its group into the output element.
     */
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

    protected override initialize(): void {
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

        this.lookupEnumerator = this.lookup.entries();
    }

    protected override handleNext(): IteratorResult<TResult> {
        // May throw if not initialized
        if (this.lookupEnumerator === undefined) {
            return this.done();
        }

        const { done, value } = this.lookupEnumerator.next();
        if (done) {
            return this.done();
        }

        const [key, values] = value;
        const result = this.resultSelector(key, Tyneq.from(values) as TyneqEnumerable<TValue>);
        return this.yield(result);
    }
}
