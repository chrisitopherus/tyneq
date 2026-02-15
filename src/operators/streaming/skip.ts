import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { SkipEnumerator } from "../../enumerators/streaming/skip";
import { IEnumerable, IEnumerator, IteratorFactory } from "../../types/core";

/**
 * Operator implementation for skipping a specified number of elements from the start.
 * 
 * @remarks
 * This is a streaming operator that bypasses the first N elements of the source
 * sequence and yields all remaining elements. Delegates enumeration logic to
 * {@link SkipEnumerator}.
 * 
 * **Performance**: O(1) space (streaming). O(n) time when fully enumerated.
 * 
 * **Operator Category**: Streaming - processes elements one-at-a-time without buffering.
 * 
 * @typeParam TSource - The type of elements in the sequence.
 * 
 * @see {@link SkipEnumerator} for the enumeration implementation.
 * @see {@link ITyneqEnumerable.skip} for the public API.
 */
export class SkipOperatorEnumerable<TSource> extends TyneqOperatorEnumerable<TSource> {
    /** The number of elements to skip from the beginning. */
    private readonly count: number;

    /**
     * Creates a new skip operator.
     * 
     * @param source - The source sequence.
     * @param count - The number of elements to bypass.
     */
    public constructor(source: IEnumerable<TSource>, count: number) {
        super(source);
        this.count = count;
    }

    public getFactory(): IteratorFactory<TSource> {
        const source = this.source;
        const count = this.count;

        return () => {
            return new SkipEnumerator<TSource>(source[Symbol.iterator](), count);
        }
    }

    public override getEnumerator(): IEnumerator<TSource> {
        return new SkipEnumerator<TSource>(this.source[Symbol.iterator](), this.count);
    }
}