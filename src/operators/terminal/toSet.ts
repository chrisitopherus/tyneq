import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { ITyneqEnumerable } from "../../types/core";

/**
 * Terminal operator implementation for converting a sequence to a Set.
 * 
 * @remarks
 * This is a terminal operator that materializes the sequence into a JavaScript Set,
 * automatically removing any duplicate values. Useful for ensuring uniqueness or
 * performing set operations.
 * 
 * **Performance**: O(n) space (creates set). O(n) time (must enumerate all elements).
 * 
 * **Operator Category**: Terminal - forces full evaluation and returns a Set.
 *
 * This method uses immediate execution. The source sequence is fully enumerated when this method is called.
 *
 * @typeParam TSource - The type of elements in the sequence.
 *
 * @see {@link ITyneqEnumerable.toSet} for the public API.
 *
 * @group Operators
 * @category Terminal
 * @internal
 */
export class ToSetOperator<TSource> extends TyneqTerminalOperator<TSource, Set<TSource>> {
    /**
     * Creates a new toSet operator.
     * 
     * @param source - The source sequence.
     */
    public constructor(source: ITyneqEnumerable<TSource>) {
        super(source);
    }

    public process(): Set<TSource> {
        return new Set(this.source);
    }
}