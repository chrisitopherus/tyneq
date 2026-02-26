import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { IEnumerable } from "../../types/core";

export class ConsumeOperator<T> extends TyneqTerminalOperator<T, void> {
    public constructor(source: IEnumerable<T>) {
        super(source);
    }

    public process(): void {
        for (const _ of this.source) {
            // intentionally consume all elements
        }
    }
}
