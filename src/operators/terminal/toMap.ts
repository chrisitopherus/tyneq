import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { Tyneq } from "../../core/tyneq";
import { ITyneqEnumerable, KeyValuePair } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

export class ToMapOperator<TSource, TKey, TValue> extends TyneqTerminalOperator<TSource, Map<TKey, TValue>> {
    private readonly selector: (item: TSource) => KeyValuePair<TKey, TValue>;

    public constructor(source: ITyneqEnumerable<TSource>, selector: (item: TSource) => KeyValuePair<TKey, TValue>) {
        super(source);
        ArgumentUtility.checkNotOptional(selector, nameof({ selector }));

        this.selector = selector;
    }

    public process(): Map<TKey, TValue> {
        return new Map<TKey, TValue>(Tyneq.from(this.source).select((item) => {
            const pair: KeyValuePair<TKey, TValue> = this.selector(item);
            return this.transformPairToTuple(pair);
        }));
    }

    private transformPairToTuple(pair: KeyValuePair<TKey, TValue>): [TKey, TValue] {
        return [pair.key, pair.value];
    }
}