import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

/**
 * Enumerator implementation for splitting a sequence into fixed-size chunks.
 * 
 * @remarks
 * This enumerator groups consecutive elements into arrays of the specified size.
 * The last chunk may contain fewer elements if the source length is not evenly divisible.
 * Streams chunks as they are completed without buffering entire sequence.
 * 
 * **Implementation**: Accumulates elements into current chunk until size reached, then yields.
 * 
 * **Performance**: O(size) space for current chunk. O(n) time when fully enumerated.
 * 
 * @typeParam T - The type of elements in the source sequence.
 * 
 * @see {@link ChunkOperatorEnumerable} for the operator that uses this enumerator.
 */
export class ChunkEnumerator<T> extends TyneqEnumerator<T, T[]> {
    /** The maximum size of each chunk. */
    private readonly size: number;
    /** Array accumulating elements for the current chunk. */
    private currentChunk: T[] = [];

    /**
     * Creates a new chunk enumerator.
     * 
     * @param sourceEnumerator - The source enumerator.
     * @param size - The maximum number of elements per chunk.
     * @throws {ArgumentError} If size is not positive.
     */
    public constructor(sourceEnumerator: IEnumerator<T>, size: number) {
        super(sourceEnumerator);
        ArgumentUtility.checkPositive(size, nameof({ size }));

        this.size = size;
    }

    /**
     * Gets the next chunk of elements.
     * Accumulates elements until chunk size is reached or source is exhausted.
     * 
     * @returns Iterator result containing the next chunk array, or done if source exhausted.
     */
    protected override handleNext(): IteratorResult<T[]> {
        while (this.currentChunk.length < this.size) {
            const next = this.sourceEnumerator.next();
            if (next.done) break;
            this.currentChunk.push(next.value);
        }

        if (this.currentChunk.length === 0) {
            return this.done();
        }

        const chunk = this.currentChunk;
        this.currentChunk = [];
        return this.yield(chunk);
    }
}