import { EnumeratorResult } from "../core/enumeratorResult";
import { IEnumerator } from "../types/core";

export class SelectEnumerator<T, U> implements IEnumerator<U> {
    private readonly inner: IEnumerator<T>;
    private readonly selector: (item: T) => U;

    public constructor(inner: IEnumerator<T>, selector: (item: T) => U) {
        this.inner = inner;
        this.selector = selector;
    }

    public next(): IteratorResult<U, any> {
        while (true) {
            const next = this.inner.next();
            if (next.done) {
                return EnumeratorResult.done();
            }

            const value = next.value;
            return EnumeratorResult.yield(this.selector(value));
        }
    }
}