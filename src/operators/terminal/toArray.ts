import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { ITyneqEnumerable } from "../../types/core";

/**
 * Terminal operator implementation for converting a sequence to an array.
 * 
 * @remarks
 * This is a terminal operator that materializes the entire sequence into a JavaScript
 * array. Uses Array.from for efficient conversion. Useful for scenarios requiring
 * indexed access or multiple iterations.
 * 
 * **Performance**: O(n) space (creates array). O(n) time (must enumerate all elements).
 * 
 * **Operator Category**: Terminal - forces full evaluation and returns an array.
 * 
 * @typeParam TSource - The type of elements in the sequence.
 * 
 * @see {@link ITyneqEnumerable.toArray} for the public API.
 */
export class ToArrayOperator<TSource> extends TyneqTerminalOperator<TSource, TSource[]> {
    /**
     * Creates a new toArray operator.
     * 
     * @param source - The source sequence.
     */
    public constructor(source: ITyneqEnumerable<TSource>) {
        super(source);
    }

    public process(): TSource[] {
        return Array.from(this.source);
    }
}