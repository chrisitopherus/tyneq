import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { ITyneqEnumerable, KeyValuePair } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";

/**
 * Terminal operator implementation for converting a sequence to a Map.
 * 
 * @remarks
 * This is a terminal operator that transforms a sequence into a JavaScript Map by
 * applying a selector to each element to extract key-value pairs. Later values with
 * duplicate keys will overwrite earlier values.
 * 
 * **Performance**: O(n) space (creates map). O(n) time (must enumerate all elements).
 * 
 * **Operator Category**: Terminal - forces full evaluation and returns a Map.
 *
 * This method uses immediate execution. The source sequence is fully enumerated when this method is called.
 *
 * @typeParam TSource - The type of elements in the source sequence.
 * @typeParam TKey - The type of keys in the resulting map.
 * @typeParam TValue - The type of values in the resulting map.
 *
 * @see {@link ITyneqEnumerable.toMap} for the public API.
 *
 * @group Operators
 * @category Terminal
 * @internal
 */
export class ToMapOperator<TSource, TKey, TValue> extends TyneqTerminalOperator<TSource, Map<TKey, TValue>> {
    /** Function to extract key-value pairs from each element. */
    private readonly selector: (item: TSource) => KeyValuePair<TKey, TValue>;

    /**
     * Creates a new toMap operator.
     * 
     * @param source - The source sequence.
     * @param selector - Function to extract key-value pairs from each element.
     * @throws {ArgumentError} If selector is null or undefined.
     */
    public constructor(source: ITyneqEnumerable<TSource>, selector: (item: TSource) => KeyValuePair<TKey, TValue>) {
        super(source);
        ArgumentUtility.checkNotOptional({ selector });

        this.selector = selector;
    }

    public process(): Map<TKey, TValue> {
        return new Map<TKey, TValue>(Array.from(this.source, (item) => {
            const pair: KeyValuePair<TKey, TValue> = this.selector(item);
            return this.transformPairToTuple(pair);
        }));
    }

    private transformPairToTuple(pair: KeyValuePair<TKey, TValue>): [TKey, TValue] {
        return [pair.key, pair.value];
    }
}