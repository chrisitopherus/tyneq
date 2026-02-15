import { TyneqGeneratorEnumerator } from "../../core/enumerators/TyneqGeneratorEnumerator";
import { ArgumentOutOfRangeError } from "../../core/errors/argument/ArgumentOutOfRangeError";
import { nameof } from "../../utility/nameof";

/**
 * Enumerator implementation for generating a sequence of consecutive integers.
 * 
 * @remarks
 * This enumerator generates integers from start to end (inclusive) without buffering.
 * Each call to next() generates the next number in the sequence.
 * 
 * **Implementation**: Maintains current value, increments on each call.
 * 
 * **Performance**: O(1) space (streaming). O(end - start + 1) time when fully enumerated.
 * 
 * @see {@link RangeOperator} for the operator that uses this enumerator.
 */
export class RangeEnumerator extends TyneqGeneratorEnumerator<number> {
    /** Current value in the range. */
    private current: number;
    /** Last value in the range (inclusive). */
    private end: number;

    /**
     * Creates a new range enumerator.
     * 
     * @param start - The first number in the range.
     * @param end - The last number in the range (inclusive).
     * @throws {ArgumentOutOfRangeError} If start is greater than end.
     */
    public constructor(start: number, end: number) {
        super();
        if (start > end) {
            throw new ArgumentOutOfRangeError(nameof({ start }), `Expected ${nameof({ start })} to be less than or equal to ${nameof({ end })}.`);
        }
        
        this.current = start;
        this.end = end;
    }

    /**
     * Generates the next integer in the range.
     * 
     * @returns Iterator result containing the next integer, or done when end is exceeded.
     */
    protected override handleNext(): IteratorResult<number> {
        if (this.current > this.end) {
            return this.complete();
        }

        return this.yield(this.current++);
    }
}