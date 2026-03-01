import { IEnumerable, IEnumerator } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

/**
 * Abstract base class for non-terminal operators that transform sequences.
 * 
 * @remarks
 * This class serves as the foundation for operators that accept a source sequence and
 * produce a new enumerable sequence as output. Unlike terminal operators, these operators
 * use deferred execution—they do not enumerate the source until the result sequence is
 * itself enumerated.
 * 
 * Operators extending this class fall into two categories:
 * 
 * **Streaming Operators** (O(1) space):
 * - Process elements one-at-a-time as they flow through
 * - Examples: `select()`, `where()`, `take()`, `skip()`
 * 
 * **Buffering Operators** (O(n) space):
 * - Must buffer some or all elements before producing output
 * - Examples: `orderBy()`, `reverse()`, `distinct()`, `groupBy()`
 * 
 * This base class provides:
 * - Source sequence validation via {@link ArgumentUtility}
 * - Implementation of the JavaScript iterator protocol (`Symbol.iterator`)
 * - Protected access to the source enumerable
 * - A contract requiring subclasses to implement {@link getEnumerator}
 * 
 * Subclasses must implement {@link getEnumerator} to return an enumerator that performs
 * the actual transformation logic.
 * 
 * @typeParam TSource - The type of elements in the source sequence.
 * @typeParam TResult - The type of elements in the result sequence. Defaults to TSource.
 * 
 * @example
 * ```typescript
 * // Example streaming operator implementation
 * class SelectOperatorEnumerable<TSource, TResult> 
 *     extends TyneqOperatorEnumerable<TSource, TResult> {
 *     
 *     private readonly selector: (item: TSource) => TResult;
 *     
 *     public constructor(source: IEnumerable<TSource>, 
 *                        selector: (item: TSource) => TResult) {
 *         super(source);
 *         this.selector = selector;
 *     }
 *     
 *     public getEnumerator(): IEnumerator<TResult> {
 *         return new SelectEnumerator(this.source[Symbol.iterator](), this.selector);
 *     }
 * }
 * ```
 * 
 * @see {@link TyneqTerminalOperator} for operators that produce single values.
 * @see {@link IEnumerable} for the enumerable interface this implements.
 */
export abstract class TyneqOperatorEnumerable<TSource, TResult = TSource> implements IEnumerable<TResult> {
    /**
     * The source enumerable sequence to transform.
     * 
     * @remarks
     * This property is protected to allow subclasses to access the source when creating
     * enumerators in {@link getEnumerator}. The source is validated for null/undefined
     * in the constructor.
     */
    protected readonly source: IEnumerable<TSource>;

    /**
     * Creates a new operator enumerable.
     * 
     * @param source - The source enumerable to transform. Must not be null or undefined.
     * 
     * @throws {@link ArgumentError} when `source` is undefined.
     * @throws {@link ArgumentNullError} when `source` is null.
     */
    public constructor(source: IEnumerable<TSource>) {
        ArgumentUtility.checkNotOptional({ source });
        this.source = source;
    }

    /**
     * Returns an enumerator for the result sequence.
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
     * Creates an enumerator that performs the transformation.
     * 
     * @remarks
     * Subclasses must implement this method to return an enumerator that applies the
     * operator's transformation logic. The enumerator typically wraps the source's
     * enumerator and modifies its behavior.
     * 
     * This method is called each time the sequence is enumerated (via `for...of`,
     * spread operator, or direct iterator access). Each call should return a fresh,
     * independent enumerator.
     * 
     * @returns A new {@link IEnumerator<TResult>} that transforms elements from the source.
     */
    public abstract getEnumerator(): IEnumerator<TResult>;
}