import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { terminal } from "../../extensibility/operatorDecorators";
import { ITyneqEnumerable, KeyValuePair } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";

/**
 * Terminal operator that converts a sequence into a TypeScript `Record` object.
 *
 * @remarks
 * This method uses immediate execution. The source sequence is fully enumerated when this method is called.
 *
 * Applies `selector` to each element to produce a key-value pair. Later elements with
 * duplicate keys overwrite earlier ones. Keys must be `string`, `number`, or `symbol`.
 *
 * @typeParam TSource - The type of elements in the source sequence.
 * @typeParam TKey - The type of keys (`string`, `number`, or `symbol`).
 * @typeParam TValue - The type of values in the resulting record.
 *
 * @see {@link ITyneqEnumerable.toRecord} for the public API.
 *
 * @group Operators
 * @category Terminal
 * @internal
 */
@terminal("toRecord")
export class ToRecordOperator<TSource, TKey extends string | number | symbol, TValue> extends TyneqTerminalOperator<TSource, Record<TKey, TValue>> {
    private readonly selector: (item: TSource) => KeyValuePair<TKey, TValue>;

    /**
     * @param source - The source sequence.
     * @param selector - Extracts a key-value pair from each element.
     * @throws {ArgumentError} If `selector` is null or undefined.
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
