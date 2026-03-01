import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { SkipLastEnumerator } from "../../enumerators/streaming/skipLast";
import { IEnumerable, IEnumerator, IteratorFactory } from "../../types/core";

/**
 * Operator implementation for skipping a specified number of elements from the end.
 * 
 * @remarks
 * This is a streaming operator that yields all elements except the last N elements.
 * Uses a rolling buffer to delay yielding elements until it knows which are not in
 * the last N. Delegates enumeration logic to {@link SkipLastEnumerator}.
 * 
 * **Performance**: O(count) space for the rolling buffer. O(n) time when fully enumerated.
 * 
 * **Operator Category**: Streaming - processes elements with minimal buffering (only count elements).
 * 
 * @typeParam TSource - The type of elements in the sequence.
 * 
 * @see {@link SkipLastEnumerator} for the enumeration implementation.
 * @see {@link ITyneqEnumerable.skipLast} for the public API.
 */
export class SkipLastOperatorEnumerable<TSource> extends TyneqOperatorEnumerable<TSource> {
    /** The number of elements to skip from the end. */
    private readonly count: number;

    /**
     * Creates a new skipLast operator.
     * 
     * @param source - The source sequence.
     * @param count - The number of elements to omit from the end.
     */
    public constructor(source: IEnumerable<TSource>, count: number) {
        super(source);
        this.count = count;
    }

    public override getEnumerator(): IEnumerator<TSource> {
        return new SkipLastEnumerator<TSource>(this.source[Symbol.iterator](), this.count);
    }
}