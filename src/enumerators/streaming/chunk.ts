import { builtinOperator } from "../../extensions/builtinOperator";
import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";

/**
 * Enumerator that splits a sequence into fixed-size chunks.
 *
 * @remarks
 * Deferred. Source is not enumerated until iteration begins.
 *
 * Groups consecutive elements into arrays of the specified size. The last chunk may contain
 * fewer elements if the source length is not evenly divisible by `size`.
 *
 * @group Enumerators
 * @internal
 */
@builtinOperator({ name: "chunk", kind: "streaming" })
export class ChunkEnumerator<T> extends TyneqEnumerator<T, T[]> {
    private readonly size: number;
    private currentChunk: T[] = [];

    /**
     * @param sourceEnumerator - The upstream enumerator to wrap.
     * @param size - Maximum number of elements per chunk; must be positive.
     */
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