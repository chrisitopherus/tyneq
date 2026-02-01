
import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { IEnumerable } from "../../types/core";

export class CountOperator<T> extends TyneqTerminalOperator<T, number> {
    public constructor(source: IEnumerable<T>) {
        super(source);
    }

    public process(): number {
        if (Array.isArray(this.source)) {
            return (this.source as T[]).length;
        }

        let count = 0;
        for (const _ of this.source) {
            count++;
        }

        return count;
    }

}