import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";
import { ItemPredicate } from "../../types/utility";

/**
 * Skips elements from the beginning of the source sequence until a predicate returns `true`,
 * then yields all remaining elements including the one that triggered the predicate.
 *
 * @remarks
 * Deferred. Source is not enumerated until the returned sequence is iterated.
 *
 * @see {@link TyneqSequence.skipUntil}
 * @group Operators
 * @category Streaming
 * @internal
 */
export class SkipUntilEnumerator<T> extends TyneqEnumerator<T> {
    private readonly predicate: ItemPredicate<T>;
    private index = 0;
    private triggered = false;

    public constructor(sourceEnumerator: Enumerator<T>, predicate: ItemPredicate<T>) {
        super(sourceEnumerator);
        this.predicate = predicate;
    }

    protected override handleNext(): IteratorResult<T> {
        while (true) {
            const next = this.sourceEnumerator.next();
            if (next.done) {
                return this.done();
            }

            if (!this.triggered) {
                this.triggered = this.predicate(next.value, this.index++);
            }

            if (this.triggered) {
                return this.yield(next.value);
            }
        }
    }
}
