import { EnumeratorResult } from "../core/enumeratorResult";
import { IEnumerator } from "../types/core";

export class SelectEnumerator<T, U> implements IEnumerator<U> {
    private readonly sourceEnumerator: IEnumerator<T>;
    private readonly selector: (item: T) => U;

    public constructor(sourceEnumerator: IEnumerator<T>, selector: (item: T) => U) {
        this.sourceEnumerator = sourceEnumerator;
        this.selector = selector;
    }

    public next(): IteratorResult<U, any> {
        while (true) {
            const next = this.sourceEnumerator.next();
            if (next.done) {
                return EnumeratorResult.done();
            }

            const value = next.value;
            return EnumeratorResult.yield(this.selector(value));
        }
    }
}