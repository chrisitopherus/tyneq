import { IEnumerable, IEnumerator } from "../../types/core";

export abstract class TerminalOperator<T, U> {
    protected readonly source: IEnumerable<T>;

    public constructor(source: IEnumerable<T>) {
        this.source = source;
    }

    public abstract process(): U;
}