import { Undefinedable } from "../types/utility";

/**
 * Factory class for creating well-formed `IteratorResult` objects.
 * 
 * @remarks
 * `TyneqIteratorResult` provides a type-safe, explicit API for constructing `IteratorResult<T>`
 * values, which are the return type of the JavaScript/TypeScript iterator protocol's `next()` method.
 * 
 * An `IteratorResult<T>` consists of:
 * - `value`: The yielded value (type `T`) or `undefined` if iteration is complete
 * - `done`: Boolean flag indicating whether iteration has finished
 * 
 * This class offers two static factory methods:
 * - {@link yield} for creating in-progress results (`done: false`)
 * - {@link complete} for creating completion results (`done: true`)
 * 
 * Using static factory methods instead of object literals ensures consistency,
 * avoids common mistakes (e.g., forgetting `done` flag), and provides clear intent.
 * 
 * The constructor is private, enforcing the use of factory methods and preventing
 * accidental misuse or invalid state combinations.
 * 
 * @typeParam T - The type of values yielded by the iterator.
 * 
 * @example
 * ```typescript
 * // In an enumerator's next() method
 * class MyEnumerator<T> implements IEnumerator<T> {
 *     private index = 0;
 *     private data: T[];
 * 
 *     constructor(data: T[]) {
 *         this.data = data;
 *     }
 * 
 *     next(): IteratorResult<T> {
 *         if (this.index < this.data.length) {
 *             const value = this.data[this.index++];
 *             return TyneqIteratorResult.yield(value);
 *         } else {
 *             return TyneqIteratorResult.complete<T>();
 *         }
 *     }
 * }
 * 
 * // Example iteration
 * const enumerator = new MyEnumerator([1, 2, 3]);
 * console.log(enumerator.next()); // { value: 1, done: false }
 * console.log(enumerator.next()); // { value: 2, done: false }
 * console.log(enumerator.next()); // { value: 3, done: false }
 * console.log(enumerator.next()); // { value: undefined, done: true }
 * ```
 * 
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols | MDN: Iteration protocols}
 */
export class TyneqIteratorResult<T> {
    /**
     * The yielded value, or `undefined` if iteration is complete.
     */
    public readonly value: T | undefined;
    
    /**
     * Indicates whether iteration has finished.
     * - `false`: More values are available; `value` contains the current element.
     * - `true`: Iteration is complete; `value` is `undefined`.
     */
    public readonly done: boolean;

    /**
     * Private constructor to enforce factory method usage.
     * 
     * @param value - The value to yield, or `undefined` if complete.
     * @param done - Whether iteration is complete.
     */
    private constructor(value: Undefinedable<T>, done: boolean) {
        this.value = value;
        this.done = done;
    }

    /**
     * Creates an in-progress `IteratorResult` that yields a value.
     * 
     * @remarks
     * Returns an `IteratorResult<T>` with `done: false` and the provided value.
     * This indicates that iteration should continue and the caller should
     * process the yielded value.
     * 
     * @param value - The value to yield to the caller.
     * 
     * @returns An `IteratorResult` with `{ value, done: false }`.
     * 
     * @example
     * ```typescript
     * // Yield value during iteration
     * return TyneqIteratorResult.yield(42);
     * // Result: { value: 42, done: false }
     * 
     * // Yield object
     * return TyneqIteratorResult.yield({ id: 1, name: 'Alice' });
     * // Result: { value: { id: 1, name: 'Alice' }, done: false }
     * ```
     */
    public static yield<T>(value: T): IteratorResult<T> {
        return new TyneqIteratorResult(value, false) as IteratorResult<T>;
    }

    /**
     * Creates a completion `IteratorResult` indicating iteration has finished.
     * 
     * @remarks
     * Returns an `IteratorResult<T>` with `done: true` and `value: undefined`.
     * This signals that no more values are available and iteration should stop.
     * 
     * Once an iterator returns a completion result, it should continue returning
     * completion results for all subsequent `next()` calls (iterator protocol contract).
     * 
     * @typeParam T - The element type of the iterator (inferred or explicit).
     * 
     * @returns An `IteratorResult` with `{ value: undefined, done: true }`.
     * 
     * @example
     * ```typescript
     * // Signal completion
     * return TyneqIteratorResult.complete<number>();
     * // Result: { value: undefined, done: true }
     * 
     * // Type is usually inferred from context
     * class NumberEnumerator implements IEnumerator<number> {
     *     next(): IteratorResult<number> {
     *         // ... when finished:
     *         return TyneqIteratorResult.complete(); // type inferred
     *     }
     * }
     * ```
     */
    public static complete<T = undefined>(): IteratorResult<T> {
        return new TyneqIteratorResult(undefined, true) as IteratorResult<T>;
    }
}