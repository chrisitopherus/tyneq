import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { IEnumerable } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

export class IndexOfOperator<T> extends TyneqTerminalOperator<T, number> {
    private readonly predicate: (item: T) => boolean;
    private readonly startIndex: number;
    public constructor(source: IEnumerable<T>, predicate: (item: T) => boolean, startIndex: number = 0) {
        super(source);
        ArgumentUtility.checkNotOptional(predicate, nameof({ predicate }));
        ArgumentUtility.checkNonNegative(startIndex, nameof({ startIndex }));

        this.predicate = predicate;
        this.startIndex = startIndex;
    }

    public process(): number {
        let index = -1;
        for (const item of this.source) {
            index++;
            if (index < this.startIndex) {
                continue;
            }

            if (this.predicate(item)) {
                return index;
            }
        }

        return -1;
    }

}