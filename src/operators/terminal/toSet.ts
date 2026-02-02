import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { ITyneqEnumerable } from "../../types/core";

export class ToSetOperator<TSource> extends TyneqTerminalOperator<TSource, Set<TSource>> {
    public constructor(source: ITyneqEnumerable<TSource>) {
        super(source);
    }

    public process(): Set<TSource> {
        return new Set(this.source);
    }
}