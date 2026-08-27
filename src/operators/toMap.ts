import { TyneqTerminalOperator } from "../core/terminal/TyneqTerminalOperator";
import { TyneqSequence, KeyValuePair } from "../types/core";
import { ArgumentUtility } from "../utility/ArgumentUtility";

/**
 * Collects all elements into a Map using a key-value selector.
 *
 * @remarks
 * Immediate. Source is fully enumerated when this method is called.
 *
 * @see {@link TyneqSequence.toMap}
 * @group Operators
 * @category Terminal
 * @internal
 */
export class ToMapOperator<TSource, TKey, TValue> extends TyneqTerminalOperator<TSource, Map<TKey, TValue>> {
    private readonly selector: (item: TSource) => KeyValuePair<TKey, TValue>;

    public constructor(source: TyneqSequence<TSource>, selector: (item: TSource) => KeyValuePair<TKey, TValue>) {
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