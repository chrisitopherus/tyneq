import type { IEnumerable, IEnumerator } from "../../types/core";
import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { PopulateEnumerator } from "../../enumerators/streaming/populate";

/**
 * Operator implementation for replacing all source elements with a constant value.
 * 
 * @remarks
 * This is a streaming operator that maintains the cardinality of the source sequence
 * while replacing each element with the specified value. Delegates enumeration logic
 * to {@link PopulateEnumerator}.
 * 
 * **Performance**: O(1) space (streaming). O(n) time when fully enumerated.
 * 
 * **Operator Category**: Streaming - processes elements one-at-a-time without buffering.
 * 
 * @typeParam TSource - The type of elements in the source sequence (ignored).
 * @typeParam TValue - The type of the replacement value.
 * 
 * @see {@link PopulateEnumerator} for the enumeration implementation.
 */
export class PopulateOperatorEnumerable<TSource, TValue> extends TyneqOperatorEnumerable<TSource, TValue> {
    /** The value to yield for each source element. */
    private readonly value: TValue;

    /**
     * Creates a new populate operator.
     * 
     * @param source - The source sequence (determines cardinality only).
     * @param value - The value to yield for each source element.
     */
    public constructor(source: IEnumerable<TSource>, value: TValue) {
        super(source);
        this.value = value;
    }

    public override getEnumerator(): IEnumerator<TValue> {
        return new PopulateEnumerator<TSource, TValue>(this.source[Symbol.iterator](), this.value);
    }
}