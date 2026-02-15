import { IEnumerable, IEnumerator } from "../../types/core";

/**
 * Abstract base class for operators that generate sequences without a source.
 * 
 * @remarks
 * This class is used for operators that create enumerable sequences from scratch rather than
 * transforming an existing source sequence. Unlike {@link TyneqOperatorEnumerable}, which wraps
 * a source enumerable, `TyneqOperator` is used for generation operators.
 * 
 * Examples of operators using this base class:
 * - `range()` - generates a sequence of consecutive integers
 * - `repeat()` - generates a sequence by repeating a value
 * - `empty()` - generates an empty sequence
 * 
 * This base class provides:
 * - Implementation of the JavaScript iterator protocol (`Symbol.iterator`)
 * - A contract requiring subclasses to implement {@link getEnumerator}
 * - Minimal overhead (no source validation needed)
 * 
 * The key distinction from {@link TyneqOperatorEnumerable}:
 * - `TyneqOperator`: Generates elements (no source required)
 * - `TyneqOperatorEnumerable`: Transforms elements from a source
 * 
 * @typeParam TSource - The logical source type (typically unused for generation).
 * @typeParam TResult - The type of elements in the generated sequence. Defaults to TSource.
 * 
 * @example
 * ```typescript
 * // Example generation operator
 * class RangeOperatorEnumerable extends TyneqOperator<number, number> {
 *     private readonly start: number;
 *     private readonly count: number;
 *     
 *     public constructor(start: number, count: number) {
 *         super();
 *         this.start = start;
 *         this.count = count;
 *     }
 *     
 *     public getEnumerator(): IEnumerator<number> {
 *         return new RangeEnumerator(this.start, this.count);
 *     }
 * }
 * ```
 * 
 * @see {@link TyneqOperatorEnumerable} for operators that transform source sequences.
 * @see {@link TyneqTerminalOperator} for operators that produce single values.
 */
export abstract class TyneqOperator<TSource, TResult = TSource> implements IEnumerable<TResult> {

    /**
     * Creates a new operator instance.
     * 
     * @remarks
     * The constructor is trivial since generation operators do not require source validation.
     * Subclasses may override to accept and validate generation parameters.
     */
    public constructor() { }

    /**
     * Returns an enumerator for the generated sequence.
     * 
     * @remarks
     * Implements the JavaScript iterator protocol. This method delegates to {@link getEnumerator}
     * to obtain the enumerator, enabling `for...of` loops and other iteration constructs.
     * 
     * Each call creates a fresh enumerator, allowing the sequence to be enumerated multiple times.
     * 
     * @returns A new {@link IEnumerator} positioned before the first element.
     */
    [Symbol.iterator](): IEnumerator<TResult> {
        return this.getEnumerator();
    }

    /**
     * Creates an enumerator that generates the sequence.
     * 
     * @remarks
     * Subclasses must implement this method to return an enumerator that generates elements
     * according to the operator's logic.
     * 
     * This method is called each time the sequence is enumerated. Each call should return a
     * fresh, independent enumerator that generates the sequence from the beginning.
     * 
     * @returns A new {@link IEnumerator<TResult>} that generates the sequence.
     */
    public abstract getEnumerator(): IEnumerator<TResult>;
}