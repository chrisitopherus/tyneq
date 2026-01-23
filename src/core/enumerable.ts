import { SelectEnumerator } from "../operators/streaming/select";
import { SelectManyEnumerator } from "../operators/streaming/selectMany";
import { AllOperator } from "../operators/terminal/all";
import { AnyOperator } from "../operators/terminal/any";
import { CountOperator } from "../operators/terminal/count";
import { WhereEnumerator } from "../operators/streaming/where";
import { CastEnumerator } from "../operators/conversion/cast";
import { IEnumerable, IEnumerator, IteratorFactory } from "../types/core";

export class Enumerable<T> implements IEnumerable<T> {
    public constructor(private readonly iteratorFactory: IteratorFactory<T>) { }

    public [Symbol.iterator](): IEnumerator<T> {
        return this.iteratorFactory();
    }

    public toArray(): T[] {
        return Array.from(this);
    }

    /**
     * Returns the number of elements in a sequence.
     * @returns The number of elements in the input sequence.
     */
    public count(): number {
        return new CountOperator<T>(this)
            .process();
    }

    /**
     * Determines whether any element of a sequence satisfies a condition.
     * @param predicate A function to test each element for a condition.
     * @returns `true` if any element in the source sequence pass the test in the specified predicate; otherwise, `false`.
     */
    public any(predicate: (item: T) => boolean): boolean {
        return new AnyOperator<T>(this, predicate)
            .process();
    }

    public all(predicate: (item: T) => boolean): boolean {
        return new AllOperator<T>(this, predicate)
            .process();
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

    public selectMany<U>(selector: (item: T) => IEnumerable<U>): Enumerable<U> {
        const source = this;
        const factory: IteratorFactory<U> = () => {
            const inner = source[Symbol.iterator]();
            return new SelectManyEnumerator<T, U>(inner, selector);
        }

        return new Enumerable<U>(factory);
    }

    /**
     * Casts the elements of a sequence to the specified type.
     * 
     * Note: This performs an unchecked type assertion. It is the caller's responsibility
     * to ensure the source elements are compatible with the target type.
     * No runtime type checking is performed (similar to LINQ's Cast in C#).
     * 
     * @returns An Enumerable<U> that contains each element of the source sequence cast to the specified type.
     */
    public cast<U>(): Enumerable<U> {
        const source = this;

        const factory: IteratorFactory<U> = () => {
            const inner = source[Symbol.iterator]();
            return new CastEnumerator<T, U>(inner);
        };

        return new Enumerable<U>(factory);
    }
}