import { IEnumerable } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

/**
 * Abstract base class for terminal operators that execute queries and return concrete values.
 * 
 * @remarks
 * Terminal operators are query operators that produce a single result value rather than
 * another enumerable sequence. They trigger immediate execution of the entire query pipeline,
 * enumerating the source sequence to compute their result.
 * 
 * Examples of terminal operators include:
 * - Aggregations: `count()`, `sum()`, `average()`, `min()`, `max()`
 * - Element retrieval: `first()`, `last()`, `single()`, `elementAt()`
 * - Boolean tests: `any()`, `all()`, `contains()`, `sequenceEqual()`
 * - Materializations: `toArray()`, `toSet()`, `toMap()`
 * 
 * This base class provides:
 * - Source sequence validation via {@link ArgumentUtility}
 * - Protected access to the source enumerable
 * - A contract requiring subclasses to implement {@link process}
 * 
 * Subclasses must implement {@link process} to define the specific terminal operation logic.
 * The {@link process} method performs the actual enumeration and computation.
 * 
 * @typeParam TSource - The type of elements in the source sequence.
 * @typeParam TResult - The type of the result value produced by the operator. Defaults to TSource.
 * 
 * @example
 * ```typescript
 * // Example terminal operator implementation
 * class CountOperator<T> extends TyneqTerminalOperator<T, number> {
 *     public process(): number {
 *         let count = 0;
 *         for (const _ of this.source) {
 *             count++;
 *         }
 *         return count;
 *     }
 * }
 * ```
 * 
 * @see {@link TyneqOperatorEnumerable} for non-terminal (streaming/buffering) operators.
 */
export abstract class TyneqTerminalOperator<TSource, TResult = TSource> {
    /**
     * The source enumerable sequence to operate on.
     * 
     * @remarks
     * This property is protected to allow subclasses to enumerate the source sequence
     * during their {@link process} implementation. The source is validated for null/undefined
     * in the constructor.
     */
    protected readonly source: IEnumerable<TSource>;

    /**
     * Creates a new terminal operator.
     * 
     * @param source - The source enumerable to operate on.
     */
    public constructor(source: IEnumerable<TSource>) {
        this.source = source;
    }

    /**
     * Executes the terminal operation and returns the result.
     * 
     * @remarks
     * Subclasses must implement this method to define their specific operation logic.
     * This method typically enumerates the {@link source} sequence (either fully or partially)
     * to compute the result.
     * 
     * The implementation may:
     * - Enumerate the entire source (e.g., `count()`, `toArray()`)
     * - Enumerate until a condition is met (e.g., `first()`, `any()`)
     * - Compare elements (e.g., `max()`, `sequenceEqual()`)
     * - Apply aggregation logic (e.g., `sum()`, `average()`)
     * 
     * @returns The computed result value.
     */
    public abstract process(): TResult;
}