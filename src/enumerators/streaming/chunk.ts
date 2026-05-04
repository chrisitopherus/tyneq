import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";

/**
 * Splits the source sequence into non-overlapping chunks of a fixed size.
 *
 * @remarks
 * Deferred. Source is not enumerated until the returned sequence is iterated.
 *
 * @see {@link TyneqSequence.chunk}
 * @group Operators
 * @category Streaming
 * @internal
 */
export class ChunkEnumerator<T> extends TyneqEnumerator<T, T[]> {
    private readonly size: number;
    private currentChunk: T[] = [];

    
    public constructor(sourceEnumerator: Enumerator<T>, size: number) {
        super(sourceEnumerator);
        this.size = size;
    }

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