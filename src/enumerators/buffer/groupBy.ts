import { builtinOperator } from "../../extensions/builtinOperator";
import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator, TyneqSequence } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { TyneqMap } from "../../utility/map";

/**
 * Enumerator that groups sequence elements by a key.
 *
 * @remarks
 * Deferred. Source is fully buffered on first iteration.
 *
 * Consumes the entire source on first iteration to build a key-to-values lookup, then yields
 * one transformed group per distinct key via the result selector.
 *
 * @group Enumerators
 * @internal
 */
@builtinOperator({ name: "groupBy", kind: "buffer" })
export class GroupByEnumerator<TSource, TKey, TValue, TResult> extends TyneqEnumerator<TSource, TResult> {
    private readonly keySelector: (item: TSource) => TKey;
    private readonly valueSelector: (item: TSource) => TValue;
    private readonly resultSelector: (key: TKey, values: TyneqSequence<TValue>) => TResult;
    private readonly groupFactory: (values: TValue[]) => TyneqSequence<TValue>;
    private lookupEnumerator?: Enumerator<[TKey, TValue[]]>;
    private lookup = new TyneqMap<TKey, TValue[]>();

    /**
     * @param sourceEnumerator - The upstream enumerator to wrap.
     * @param keySelector - Extracts the grouping key from each element.
     * @param valueSelector - Transforms each element into the group element type.
     * @param resultSelector - Combines a key and its group into the output element.
     * @param groupFactory - Creates an {@link TyneqSequence} wrapping a group's value array.
     */
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
            const val = this.valueSelector(value);
            const group = this.lookup.getOrInit(key, () => []);
            group.push(val);
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