import { TyneqOperator } from "../../core/operator/TyneqOperator";
import { RangeEnumerator } from "../../enumerators/streaming/range";
import { IEnumerable, IEnumerator, IteratorFactory } from "../../types/core";

/**
 * Operator implementation for generating a numeric range sequence.
 * 
 * @remarks
 * This is a streaming operator that generates a sequence of integers from a starting
 * value to a maximum value (inclusive). Delegates enumeration logic to {@link RangeEnumerator}.
 * 
 * **Performance**: O(1) space (streaming). O(max - start + 1) time when fully enumerated.
 * 
 * **Operator Category**: Streaming - generates numbers on-demand without buffering.
 * 
 * @see {@link RangeEnumerator} for the enumeration implementation.
 */
export class RangeOperatorEnumerable extends TyneqOperator<number> {
    /** The first number in the range. */
    private readonly start: number;
    /** The last number in the range (inclusive). */
    private readonly max: number;

    /**
     * Creates a new range operator.
     * 
     * @param start - The first number in the range.
     * @param max - The last number in the range (inclusive).
     */
    public constructor(start: number, max: number) {
        super();

        this.start = start;
        this.max = max;
    }

    public override getEnumerator(): IEnumerator<number> {
        return new RangeEnumerator(this.start, this.max);
    }
}