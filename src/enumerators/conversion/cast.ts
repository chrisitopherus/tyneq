import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from "../../types/core";

/**
 * Enumerator implementation that performs an unchecked type cast on each element of a sequence.
 * 
 * @remarks
 * This enumerator operates in a streaming manner, casting each element from type T to type U using
 * TypeScript's type assertion mechanism. **No runtime type checking is performed** - the cast is purely
 * a compile-time operation that instructs the type system to treat values as the target type.
 * 
 * **Safety Warning:**
 * This operation is inherently unsafe and can lead to runtime errors if the actual runtime types
 * don't match the asserted type U. Use this only when you have external guarantees about the actual
 * types of elements in the sequence. For safer type filtering with runtime validation, use `OfTypeEnumerator`
 * which leverages type guards.
 * 
 * The cast operation is essentially a type-level pass-through that doesn't modify element values,
 * only their perceived type in the TypeScript type system.
 * 
 * **Common Use Cases:**
 * - Converting from a broader type to a narrower type when the developer knows the actual runtime type
 * - Adapting sequences after operations that lose type information
 * - Interoperating with untyped or loosely-typed APIs
 * 
 * **Performance Characteristics:**
 * - Time Complexity: O(1) per element
 * - Space Complexity: O(1) - no buffering required
 * - Streaming: Elements are processed one at a time without materializing the sequence
 * - Runtime Cost: Negligible - the cast is a type system operation with no runtime overhead
 * 
 * @typeParam T - The source type of elements in the sequence
 * @typeParam U - The target type to cast elements to (unchecked at runtime)
 *
 * @group Enumerators
 * @internal
 */
export class CastEnumerator<T, U> extends TyneqEnumerator<T, U> {
    /**
     * Initializes a new instance of the CastEnumerator class.
     * 
     * @param sourceEnumerator - The source enumerator whose elements will be cast to type U
     */
    public constructor(sourceEnumerator: IEnumerator<T>) {
        super(sourceEnumerator);
    }

    /**
     * Advances the enumerator to the next element, casting it to the target type.
     * 
     * This method fetches the next element from the source and performs an unchecked type assertion
     * from T to U via the `unknown` intermediate type. The double assertion (T → unknown → U) allows
     * the type system to accept the cast even when T and U are unrelated types.
     * 
     * **Warning:** This operation provides no runtime safety. If the actual value is not compatible
     * with type U, subsequent operations on the value may fail or produce unexpected results.
     * 
     * @returns An iterator result containing the next element cast to type U, or done if the sequence is exhausted
     */
    protected override handleNext(): IteratorResult<U> {
        const next = this.sourceEnumerator.next();
        if (next.done) {
            return this.done();
        }

        const castValue = next.value as unknown as U;
        return this.yield(castValue);
    }
}