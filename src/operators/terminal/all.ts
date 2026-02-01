import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { IEnumerable } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

export class AllOperator<T> extends TyneqTerminalOperator<T, boolean> {
    private readonly predicate: (item: T) => boolean;

    public constructor(source: IEnumerable<T>, predicate: (item: T) => boolean) {
        super(source);
        ArgumentUtility.checkNotOptional(predicate, nameof({ predicate }));
        
        this.predicate = predicate;
    }

    public process(): boolean {
        const enumerator = this.source[Symbol.iterator]();
        while (true) {
            const next = enumerator.next();
            if (next.done) {
                break;
            }

            if (!this.predicate(next.value)) {
                return false;
            }
        }

        return true;
    }

}