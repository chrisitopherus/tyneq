import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from "../../types/core";

/**
 * Enumerator implementation that filters elements based on a type guard, yielding only elements of a specific type.
 * 
 * @remarks
 * This enumerator operates in a streaming manner, testing each element against a type guard predicate and
 * yielding only those elements that pass the guard. The type guard performs runtime type checking, ensuring
 * type safety while narrowing the type from T to U.
 * 
 * Unlike `CastEnumerator`, this operation is safe - it validates types at runtime using the provided guard
 * function. The guard must be a TypeScript type predicate (`value is U`) that performs actual runtime checks
 * and informs the type system of the narrowed type when it returns true.
 * 
 * The implementation loops through source elements, continuously evaluating the type guard until an element
 * of the target type is found or the sequence is exhausted. Elements that fail the type guard are filtered out.
 * 
 * **Type Constraint:**
 * The generic constraint `U extends T` ensures the target type is a subtype of the source type, which is
 * the typical pattern for type narrowing operations.
 * 
 * **Performance Characteristics:**
 * - Time Complexity: O(n) in worst case where n is number of non-matching elements before a match
 * - Space Complexity: O(1) - no buffering required
 * - Streaming: Elements are processed one at a time without materializing the sequence
 * - Runtime Validation: Type guard is executed for every source element until a match is found
 * 
 * @typeParam T - The source type of elements in the sequence
 * @typeParam U - The target subtype to filter for (must extend T)
 *
 * @group Enumerators
 * @internal
 */
export class OfTypeEnumerator<T, U extends T> extends TyneqEnumerator<T, U> {
    /**
     * The type guard predicate that validates whether an element is of type U.
     * Must perform runtime checks and return a type predicate result.
     */
    private readonly guard: (value: T) => value is U;

    /**
     * Initializes a new instance of the OfTypeEnumerator class.
     * 
     * @param sourceEnumerator - The source enumerator to filter elements from
     * @param guard - The type guard function that validates and narrows element types
     */
    public constructor(sourceEnumerator: IEnumerator<T>, guard: (value: T) => value is U) {
        super(sourceEnumerator);
        this.guard = guard;
    }

    /**
     * Advances the enumerator to the next element that passes the type guard.
     * 
     * This method loops through the source elements, evaluating the type guard for each until an element
     * is found that returns true. That element is yielded with its type narrowed to U. If all remaining
     * elements fail the type guard, the loop continues until the source is exhausted.
     * 
     * The type guard performs runtime validation, ensuring only elements of the correct type are yielded.
     * This provides type safety while filtering, unlike the unsafe `CastEnumerator`.
     * 
     * @returns An iterator result containing the next element of type U where the guard returns true,
     *          or done if the source is exhausted without finding a matching element
     */
    protected override handleNext(): IteratorResult<U> {
        while (true) {
            const { value, done } = this.sourceEnumerator.next();
            if (done) {
                return this.done();
            }

            if (this.guard(value)) {
                return this.yield(value);
            }
        }
    }
}