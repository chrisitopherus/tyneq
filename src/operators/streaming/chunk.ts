import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { ChunkEnumerator } from "../../enumerators/streaming/chunk";
import { IEnumerable, IEnumerator, IteratorFactory } from "../../types/core";

/**
 * Operator implementation for splitting a sequence into fixed-size chunks.
 * 
 * @remarks
 * This is a streaming operator that groups consecutive elements into arrays of the
 * specified size. The last chunk may contain fewer elements if the sequence length is
 * not evenly divisible. Delegates enumeration logic to {@link ChunkEnumerator}.
 * 
 * **Performance**: O(size) space per chunk. O(1) space overall (streaming).
 * O(n) time when fully enumerated.
 * 
 * **Operator Category**: Streaming - buffers only the current chunk, not the entire sequence.
 * 
 * @typeParam TSource - The type of elements in the sequence.
 * 
 * @see {@link ChunkEnumerator} for the enumeration implementation.
 * @see {@link ITyneqEnumerable.chunk} for the public API.
 */
export class ChunkOperatorEnumerable<TSource> extends TyneqOperatorEnumerable<TSource, TSource[]> {
    /** The maximum size of each chunk. */
    private readonly size: number;

    /**
     * Creates a new chunk operator.
     * 
     * @param source - The source sequence.
     * @param size - The maximum size of each chunk. Must be positive.
     */
    public constructor(source: IEnumerable<TSource>, size: number) {
        super(source);
        this.size = size;
    }

    public override getEnumerator(): IEnumerator<TSource[]> {
        return new ChunkEnumerator<TSource>(this.source[Symbol.iterator](), this.size);
    }
}