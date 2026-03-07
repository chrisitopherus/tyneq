import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { ITyneqEnumerable, KeyValuePair } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";

/**
 * Terminal operator implementation for converting a sequence to a Record object.
 * 
 * @remarks
 * This is a terminal operator that transforms a sequence into a TypeScript Record by
 * applying a selector to each element to extract key-value pairs. Later values with
 * duplicate keys will overwrite earlier values. Keys must be string, number, or symbol.
 * 
 * **Performance**: O(n) space (creates record). O(n) time (must enumerate all elements).
 * 
 * **Operator Category**: Terminal - forces full evaluation and returns a Record.
 *
 * This method uses immediate execution. The source sequence is fully enumerated when this method is called.
 *
 * @typeParam TSource - The type of elements in the source sequence.
 * @typeParam TKey - The type of keys (must be string, number, or symbol).
 * @typeParam TValue - The type of values in the resulting record.
 *
 * @see {@link ITyneqEnumerable.toRecord} for the public API.
 *
 * @group Operators
 * @category Terminal
 * @internal
 */
export class ToRecordOperator<TSource, TKey extends string | number | symbol, TValue> extends TyneqTerminalOperator<TSource, Record<TKey, TValue>> {
    /** Function to extract key-value pairs from each element. */
    private readonly selector: (item: TSource) => KeyValuePair<TKey, TValue>;

    /**
     * Creates a new toRecord operator.
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

    public process(): Record<TKey, TValue> {
        const result = {} as Record<TKey, TValue>;

        for (const item of this.source) {
            const pair = this.selector(item);
            result[pair.key] = pair.value;
        }

        return result;
    }
}