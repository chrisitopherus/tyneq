import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { IEnumerable } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

export class CountByOperator<T> extends TyneqTerminalOperator<T, number> {
    private readonly predicate: (item: T) => boolean;

    public constructor(source: IEnumerable<T>, predicate: (item: T) => boolean) {
        super(source);
        ArgumentUtility.checkNotOptional({ predicate });
        this.predicate = predicate;
    }

    public process(): number {
        let count = 0;
        for (const item of this.source) {
            if (this.predicate(item)) {
                count++;
            }
        }

        return count;
    }
}
