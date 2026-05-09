import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";
import { ItemPredicate } from "../../types/utility";

/**
 * Yields elements from the beginning of the source sequence until a predicate returns `true`,
 * then stops. The element that triggered the predicate is not included.
 *
 * @remarks
 * Deferred. Source is not enumerated until the returned sequence is iterated.
 *
 * @see {@link TyneqSequence.takeUntil}
 * @group Operators
 * @category Streaming
 * @internal
 */
export class TakeUntilEnumerator<T> extends TyneqEnumerator<T> {
    private readonly predicate: ItemPredicate<T>;
    private index = 0;

    public constructor(sourceEnumerator: Enumerator<T>, predicate: ItemPredicate<T>) {
        super(sourceEnumerator);
        this.predicate = predicate;
    }

    protected override handleNext(): IteratorResult<T> {
        const next = this.sourceEnumerator.next();
        if (next.done) {
            return this.done();
        }

        if (this.predicate(next.value, this.index++)) {
            return this.earlyComplete();
        }

        return this.yield(next.value);
    }
}
