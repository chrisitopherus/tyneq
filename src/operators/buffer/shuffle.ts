import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { ShuffleEnumerator } from "../../enumerators/buffer/shuffle";
import { IEnumerable, IEnumerator, IteratorFactory } from "../../types/core";

/**
 * Operator implementation for randomizing element order.
 * 
 * @remarks
 * This is a buffering operator that returns elements in random order using the
 * Fisher-Yates shuffle algorithm. Each enumeration produces a new random ordering.
 * Delegates the actual enumeration logic to {@link ShuffleEnumerator}.
 * 
 * **Performance**: O(n) time, O(n) space. Must buffer all elements to shuffle them.
 * 
 * **Operator Category**: Buffering - materializes entire sequence into an array before
 * applying Fisher-Yates shuffle and yielding.
 * 
 * **Randomness**: Uses `Math.random()` for randomization. Each enumeration produces
 * a different random order.
 * 
 * @typeParam TSource - The type of elements in the sequence.
 * 
 * @see {@link ShuffleEnumerator} for the enumeration implementation.
 * @see {@link ITyneqEnumerable.shuffle} for the public API.
 */
export class ShuffleOperatorEnumerable<TSource> extends TyneqOperatorEnumerable<TSource> {
    /**
     * Creates a new shuffle operator for the given source sequence.
     * 
     * @param source - The source sequence to shuffle.
     */
    public constructor(source: IEnumerable<TSource>) {
        super(source);
    }

    public override getEnumerator(): IEnumerator<TSource> {
        return new ShuffleEnumerator<TSource>(this.source[Symbol.iterator]());
    }
}