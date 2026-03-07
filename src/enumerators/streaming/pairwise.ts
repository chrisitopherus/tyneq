import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from "../../types/core";

/**
 * Enumerator implementation for pairing each element with its predecessor.
 *
 * @remarks
 * Yields consecutive overlapping pairs `[prev, current]` from the source sequence.
 * The first element is buffered and used as the "previous" value for the first pair.
 * A sequence of n elements produces n-1 pairs. An empty or single-element sequence
 * produces no pairs.
 *
 * **Performance**: O(1) space (streaming). O(n) time when fully enumerated.
 *
 * @typeParam T - The type of elements in the source sequence.
 *
 * @group Enumerators
 * @internal
 */
export class PairwiseEnumerator<T> extends TyneqEnumerator<T, [T, T]> {
    private hasPrevious = false;
    private previous!: T;

    public constructor(sourceEnumerator: IEnumerator<T>) {
        super(sourceEnumerator);
    }

    protected override handleNext(): IteratorResult<[T, T]> {
        while (true) {
            const next = this.sourceEnumerator.next();
            if (next.done) {
                return this.done();
            }

            if (!this.hasPrevious) {
                this.previous = next.value;
                this.hasPrevious = true;
                continue;
            }

            const pair: [T, T] = [this.previous, next.value];
            this.previous = next.value;
            return this.yield(pair);
        }
    }
}
