import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { terminal } from "../../extensibility/operatorDecorators";
import { ITyneqEnumerable, KeyValuePair } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";

/**
 * Terminal operator that converts a sequence into a JavaScript `Map`.
 *
 * @remarks
 * This method uses immediate execution. The source sequence is fully enumerated when this method is called.
 *
 * Applies `selector` to each element to produce a key-value pair. Later elements with
 * duplicate keys overwrite earlier ones.
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
@terminal("toMap")
export class ToMapOperator<TSource, TKey, TValue> extends TyneqTerminalOperator<TSource, Map<TKey, TValue>> {
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
