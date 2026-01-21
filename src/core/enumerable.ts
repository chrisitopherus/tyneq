import { SelectEnumerator } from "../operators/select";
import { WhereEnumerator } from "../operators/where";
import { IEnumerable, IEnumerator, IteratorFactory } from "../types/core";

export class Enumerable<T> implements IEnumerable<T> {
    public constructor(private readonly iteratorFactory: IteratorFactory<T>) { }

    public [Symbol.iterator](): IEnumerator<T> {
        return this.iteratorFactory();
    }

    public toArray(): T[] {
        return Array.from(this);
    }

    public where(predicate: (item: T) => boolean): Enumerable<T> {
        const source = this;

        const factory: IteratorFactory<T> = () => {
            const inner = source[Symbol.iterator]();
            return new WhereEnumerator<T>(inner, predicate);
        };

        return new Enumerable<T>(factory);
    }

    public select<U>(selector: (item: T) => U): Enumerable<U> {
        const source = this;

        const factory: IteratorFactory<U> = () => {
            const inner = source[Symbol.iterator]();
            return new SelectEnumerator<T, U>(inner, selector);
        };

        return new Enumerable<U>(factory);
    }
}