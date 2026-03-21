import { Undefinedable } from "../types/utility";

/**
 * Factory class for creating well-formed `IteratorResult` objects.
 *
 * @remarks
 * Use {@link yield} to signal that a value is available, and {@link complete} to signal
 * that iteration has finished.
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
     * @returns `{ value, done: false }`
     */
    public static yield<T>(value: T): IteratorResult<T> {
        return new TyneqIteratorResult(value, false) as IteratorResult<T>;
    }

    /**
     * Creates a completion `IteratorResult`.
     *
     * @returns `{ value: undefined, done: true }`
     */
    public static complete<T = undefined>(): IteratorResult<T> {
        return new TyneqIteratorResult(undefined, true) as IteratorResult<T>;
    }
}
