import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { IEnumerable } from "../../types/core";

export class ContainsOperator<TSource> extends TyneqTerminalOperator<TSource, boolean> {
    private readonly value: TSource;

    public constructor(source: IEnumerable<TSource>, value: TSource) {
        super(source);
        this.value = value;
    }
    public process(): boolean {
        for (const item of this.source) {
            if (item === this.value) {
                return true;
            }
        }

        return false;
    }

}