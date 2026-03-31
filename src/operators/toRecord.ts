import { TyneqTerminalOperator } from "../core/TyneqTerminalOperator";
import { TyneqSequence, KeyValuePair } from "../types/core";
import { ArgumentUtility } from "../utility/argumentUtility";

/**
 * Collects all elements into a plain object record using a key-value selector.
 *
 * @remarks
 * Immediate. Source is fully enumerated when this method is called.
 *
 * @see {@link TyneqSequence.toRecord}
 * @group Operators
 * @category Terminal
 * @internal
 */
export class ToRecordOperator<TSource, TKey extends string | number | symbol, TValue> extends TyneqTerminalOperator<TSource, Record<TKey, TValue>> {
    private readonly selector: (item: TSource) => KeyValuePair<TKey, TValue>;

    
    public constructor(source: TyneqSequence<TSource>, selector: (item: TSource) => KeyValuePair<TKey, TValue>) {
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