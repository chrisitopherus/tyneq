import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { Tyneq } from "../../core/tyneq";
import { ITyneqEnumerable, KeyValuePair } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

export class ToRecordOperator<TSource, TKey extends string | number | symbol, TValue> extends TyneqTerminalOperator<TSource, Record<TKey, TValue>> {
    private readonly selector: (item: TSource) => KeyValuePair<TKey, TValue>;

    public constructor(source: ITyneqEnumerable<TSource>, selector: (item: TSource) => KeyValuePair<TKey, TValue>) {
        super(source);
        ArgumentUtility.checkNotOptional(selector, nameof({ selector }));

        this.selector = selector;
    }

    public process(): Record<TKey, TValue> {
        const result = {} as Record<TKey, TValue>;

        for (const item of Tyneq.from(this.source)) {
            const pair = this.selector(item);
            result[pair.key] = pair.value;
        }

        return result;
    }
}