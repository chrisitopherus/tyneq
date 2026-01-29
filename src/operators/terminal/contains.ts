import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { IEnumerable, IEnumerator } from "../../types/core";

export class ContainsOperator<TSource> extends TyneqTerminalOperator<TSource, boolean> {
    private readonly value: TSource;

    public constructor(source: IEnumerable<TSource>, value: TSource) {
        super(source);
        this.value = value;
    }
    public process(): boolean {
        const enumerator: IEnumerator<TSource> = this.source[Symbol.iterator]();
        while (true) {
            const { done, value } = enumerator.next();
            if (done) {
                return false;
            }

            if (value === this.value) {
                return true;
            }
        }
    }

}