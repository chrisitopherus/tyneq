import { builtinOperator } from "../../extensions/builtinOperator";
import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";

/**
 * Enumerator that yields elements in randomized order.
 *
 * @remarks
 * Deferred. Source is fully buffered on first iteration.
 *
 * Consumes the entire source on first iteration, shuffles the buffer in-place using the
 * Fisher-Yates algorithm, then yields elements in the shuffled order.
 *
 * @group Enumerators
 * @internal
 */
@builtinOperator({ name: "shuffle", kind: "buffer" })
export class ShuffleEnumerator<TSource> extends TyneqEnumerator<TSource> {
    private buffer: TSource[] = [];
    private currentIndex = 0;

    /**
     * @param sourceEnumerator - The upstream enumerator to wrap.
     */
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