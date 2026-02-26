import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { IEnumerable } from "../../types/core";
import { EnumeratorUtility } from "../../utility/EnumeratorUtility";

export class IsNullOrEmptyOperator<T> extends TyneqTerminalOperator<T, boolean> {
    public constructor(source: IEnumerable<T>) {
        super(source);
    }

    public process(): boolean {
        if (this.source === null || this.source[Symbol.iterator] === null) {
            return true;
        }

        const iterator = this.source[Symbol.iterator]();
        const first = iterator.next();
        
        EnumeratorUtility.tryDispose(iterator);
        return first.done === true;
    }
}
