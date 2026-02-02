import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { ITyneqEnumerable } from "../../types/core";

export class ToArrayOperator<TSource> extends TyneqTerminalOperator<TSource, TSource[]> {
    public constructor(source: ITyneqEnumerable<TSource>) {
        super(source);
    }

    public process(): TSource[] {
        return Array.from(this.source);
    }
}