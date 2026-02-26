import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from "../../types/core";

/**
 * Enumerator implementation for randomizing the order of sequence elements.
 * 
 * @remarks
 * This enumerator consumes the entire source sequence on first iteration to buffer all
 * elements, shuffles them using Fisher-Yates algorithm, then yields them in random order.
 * 
 * **Implementation**: Buffers all source elements into an array on first call, shuffles
 * in-place, then yields in shuffled order.
 * 
 * **Performance**: O(n) space for buffering. O(n) time for shuffling.
 * 
 * @typeParam TSource - The type of elements in the sequence.
 * 
 * @see {@link ShuffleOperatorEnumerable} for the operator that uses this enumerator.
 */
export class ShuffleEnumerator<TSource> extends TyneqEnumerator<TSource> {
    /** Whether shuffling has been performed. */
    private isShuffled = false;
    /** Array containing all source elements in shuffled order. */
    private buffer: TSource[] = [];
    /** Current position in the shuffled buffer. */
    private currentIndex = 0;

    /**
     * Creates a new shuffle enumerator.
     * 
     * @param sourceEnumerator - The source enumerator.
     */
    public constructor(sourceEnumerator: IEnumerator<TSource>) {
        super(sourceEnumerator);
    }

    /**
     * Gets the next element in shuffled order.
     * On first call, consumes entire source and shuffles.
     * 
     * @returns Iterator result containing the next shuffled element, or done if exhausted.
     */
    protected override handleNext(): IteratorResult<TSource> {
        if (!this.isShuffled) {
            const buffer = Array.from(this.toIterable(this.sourceEnumerator));
            this.shuffle(buffer);
            this.buffer = buffer;
            this.isShuffled = true;
        }

        if (this.buffer.length <= this.currentIndex) {
            return this.done();
        }

        const result = this.buffer[this.currentIndex];
        this.currentIndex++;
        return this.yield(result);
    }

    /**
     * Shuffles array elements in-place using Fisher-Yates algorithm.
     * 
     * @param array - The array to shuffle.
     * @returns The same array, shuffled in-place.
     */
    private shuffle<T>(array: T[]): T[] {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }

        return array;
    }

    private toIterable(sourceEnumerator: IEnumerator<TSource>): Iterable<TSource> {
        return {
            [Symbol.iterator]: () => sourceEnumerator
        };
    }
}