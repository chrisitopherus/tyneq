import { Undefinedable } from "../types/utility";

/**
 * Factory class for creating well-formed `IteratorResult` objects.
 *
 * @remarks
 * Provides a type-safe, explicit API for constructing `IteratorResult<T>` values.
 * Use {@link yield} to signal that a value is available, and {@link complete} to signal
 * that iteration has finished.
 *
 * @typeParam T - The type of values yielded by the iterator.
 *
 * @group Classes
 * @internal
 */
export class TyneqIteratorResult<T> {
    public readonly value: T | undefined;

    public readonly done: boolean;

    private constructor(value: Undefinedable<T>, done: boolean) {
        this.value = value;
        this.done = done;
    }

    /**
     * Creates an in-progress `IteratorResult` carrying `value`.
     *
     * @param value - The element to yield.
     *
     * @returns `{ value, done: false }`
     */
    public static yield<T>(value: T): IteratorResult<T> {
        return new TyneqIteratorResult(value, false) as IteratorResult<T>;
    }

    /**
     * Creates a completion `IteratorResult`.
     *
     * @typeParam T - The element type of the iterator.
     *
     * @returns `{ value: undefined, done: true }`
     */
    public static complete<T = undefined>(): IteratorResult<T> {
        return new TyneqIteratorResult(undefined, true) as IteratorResult<T>;
    }
}
