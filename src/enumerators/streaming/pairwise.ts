import { builtinOperator } from "../../extensions/builtinOperator";
import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";

/**
 * Enumerator that yields consecutive overlapping pairs from a sequence.
 *
 * @remarks
 * Deferred. Source is not enumerated until iteration begins.
 *
 * Each pair is `[previous, current]`. A sequence of n elements produces n-1 pairs.
 * An empty or single-element sequence produces no output.
 *
 * @group Enumerators
 * @internal
 */
@builtinOperator({ name: "pairwise", kind: "streaming" })
export class PairwiseEnumerator<T> extends TyneqEnumerator<T, [T, T]> {
    private hasPrevious = false;
    private previous!: T;

    public constructor(sourceEnumerator: Enumerator<T>) {
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