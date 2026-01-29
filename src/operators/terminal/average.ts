import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { IEnumerable, IEnumerator } from "../../types/core";

export class AverageOperator<T> extends TyneqTerminalOperator<T, number> {
    private readonly selector: (item: T) => number;

    public constructor(source: IEnumerable<T>, selector: (item: T) => number) {
        super(source);
        this.selector = selector;
    }

    public process(): number {
        let count = 0;
        let sum = 0;
        const enumerator: IEnumerator<T> = this.source[Symbol.iterator]();

        while (true) {
            const { done, value } = enumerator.next();
            if (done) {
                break;
            }

            sum += this.selector(value);
            count++;
        }

        return count === 0 ? 0 : sum / count;
    }

}