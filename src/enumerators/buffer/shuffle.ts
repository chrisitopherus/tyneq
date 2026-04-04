import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";

/**
 * Returns the elements of the source sequence in a random order.
 *
 * @remarks
 * Deferred. Source is fully buffered on the first iteration of the returned sequence.
 *
 * @see {@link TyneqSequence.shuffle}
 * @group Operators
 * @category Buffering
 * @internal
 */
export class ShuffleEnumerator<TSource> extends TyneqEnumerator<TSource> {
    private buffer: TSource[] = [];
    private currentIndex = 0;

    
    public constructor(sourceEnumerator: Enumerator<TSource>) {
        super(sourceEnumerator);
    }

    protected override initialize(): void {
        const buffer = Array.from(this.toIterable(this.sourceEnumerator));
        this.shuffle(buffer);
        this.buffer = buffer;
    }

    protected override handleNext(): IteratorResult<TSource> {
        if (this.buffer.length <= this.currentIndex) {
            return this.done();
        }

        const result = this.buffer[this.currentIndex];
        this.currentIndex++;
        return this.yield(result);
    }

    private shuffle<T>(array: T[]): T[] {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }

        return array;
    }

    private toIterable(sourceEnumerator: Enumerator<TSource>): Iterable<TSource> {
        return {
            [Symbol.iterator]: () => sourceEnumerator
        };
    }
}