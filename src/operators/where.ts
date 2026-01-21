import { IEnumerator } from '../types/core';

export class WhereEnumerator<T> implements IEnumerator<T> {
    private readonly inner: IEnumerator<T>;
    private readonly predicate: (item: T) => boolean;

    public constructor(inner: IEnumerator<T>, predicate: (item: T) => boolean) {
        this.inner = inner;
        this.predicate = predicate;
    }

    public next(): IteratorResult<T, any> {
        while (true) {
            const next = this.inner.next();
            if (next.done) {
                return next;
            }

            const value = next.value;
            if (this.predicate(value)) {
                return { done: false, value };
            }
        }
    }
}