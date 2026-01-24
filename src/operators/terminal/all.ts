import { TerminalOperator } from "../../core/terminalOperator";
import { IEnumerable } from "../../types/core";

export class AllOperator<T> extends TerminalOperator<T, boolean> {
    private readonly predicate: (item: T) => boolean;

    public constructor(source: IEnumerable<T>, predicate: (item: T) => boolean) {
        super(source);
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