import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { IEnumerable } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

export class AverageOperator<T> extends TyneqTerminalOperator<T, number> {
    private readonly selector: (item: T) => number;

    public constructor(source: IEnumerable<T>, selector: (item: T) => number) {
        super(source);
        ArgumentUtility.checkNotOptional(selector, nameof({ selector }));

        this.selector = selector;
    }

    public process(): number {
        let count = 0;
        let sum = 0;

        for (const item of this.source) {
            sum += this.selector(item);
            count++;
        }

        return count === 0 ? 0 : sum / count;
    }

}