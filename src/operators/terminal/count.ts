
import { TerminalOperator } from "../../core/terminalOperator";
import { IEnumerable, IEnumerator } from "../../types/core";

export class CountOperator<T> extends TerminalOperator<T, number> {
    public constructor(source: IEnumerable<T>) {
        super(source);
    }

    public process(): number {
        if (Array.isArray(this.source)) {
            return (this.source as T[]).length;
        }

        let count = 0;
        const enumerator: IEnumerator<T> = this.source[Symbol.iterator]();
        while (true) {
            const next = enumerator.next();
            if (next.done) {
                break;
            }

            count++;
        }

        return count;
    }

}