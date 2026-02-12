import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from "../../types/core";

export class ShuffleEnumerator<TSource> extends TyneqEnumerator<TSource> {
    private isShuffled = false;
    private buffer: TSource[] = [];
    private currentIndex = 0;

    public constructor(sourceEnumerator: IEnumerator<TSource>) {
        super(sourceEnumerator);
    }

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