import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { TakeWhileEnumerator } from "../../enumerators/streaming/takeWhile";
import { IEnumerable, IEnumerator, IteratorFactory } from "../../types/core";

/**
 * Operator implementation for taking elements while a predicate is true.
 * 
 * @remarks
 * This is a streaming operator that yields elements from the start of the sequence
 * as long as a predicate returns true. Stops enumeration at the first element that
 * fails the predicate. Delegates enumeration logic to {@link TakeWhileEnumerator}.
 * 
 * **Performance**: O(1) space (streaming). O(k) time where k is the number of elements
 * that satisfy the predicate.
 * 
 * **Operator Category**: Streaming - processes elements one-at-a-time without buffering.
 * 
 * @typeParam TSource - The type of elements in the sequence.
 * 
 * @see {@link TakeWhileEnumerator} for the enumeration implementation.
 * @see {@link ITyneqEnumerable.takeWhile} for the public API.
 */
export class TakeWhileOperatorEnumerable<TSource> extends TyneqOperatorEnumerable<TSource> {
    /** Predicate function to test elements for yielding. */
    private readonly predicate: (item: TSource) => boolean;

    /**
     * Creates a new takeWhile operator.
     * 
     * @param source - The source sequence.
     * @param predicate - Function to test each element (stops at first false).
     */
    public constructor(source: IEnumerable<TSource>, predicate: (item: TSource) => boolean) {
        super(source);
        this.predicate = predicate;
    }

    public override getEnumerator(): IEnumerator<TSource> {
        return new TakeWhileEnumerator<TSource>(this.source[Symbol.iterator](), this.predicate);
    }
}