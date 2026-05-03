import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator, Enumerable } from "../../types/core";

/**
 * Repeats the source sequence a specified number of times.
 *
 * @remarks
 * Deferred. Source is not enumerated until the returned sequence is iterated.
 * Re-enumerates the source from the beginning for each repetition.
 * Returns an empty sequence when `count` is 0.
 *
 * @see {@link TyneqSequence.repeat}
 * @group Operators
 * @category Streaming
 * @internal
 */
export class RepeatSequenceEnumerator<T> extends TyneqEnumerator<T> {
    private readonly source: Enumerable<T>;
    private readonly count: number;
    private repetition = 0;
    private currentEnumerator: Enumerator<T>;

    public constructor(sourceEnumerator: Enumerator<T>, source: Enumerable<T>, count: number) {
        super(sourceEnumerator);
        this.source = source;
        this.count = count;
        this.currentEnumerator = sourceEnumerator;
    }

    protected override handleNext(): IteratorResult<T> {
        while (true) {
            if (this.repetition >= this.count) {
                return this.done();
            }

            const next = this.currentEnumerator.next();
            if (!next.done) {
                return this.yield(next.value);
            }

            this.repetition++;
            this.currentEnumerator = this.source[Symbol.iterator]();
        }
    }
}
