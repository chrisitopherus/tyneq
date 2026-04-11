import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";
import { ItemPredicate } from "../../types/utility";
import { ArgumentUtility } from "../../utility/ArgumentUtility";

/**
 * Skips elements from the beginning of the source sequence as long as a predicate is true.
 *
 * @remarks
 * Deferred. Source is not enumerated until the returned sequence is iterated.
 *
 * @see {@link TyneqSequence.skipWhile}
 * @group Operators
 * @category Streaming
 * @internal
 */
export class SkipWhileEnumerator<T> extends TyneqEnumerator<T> {
    private readonly predicate: ItemPredicate<T>;
    private index: number = 0;
    private isSkipping = true;


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

            this.isSkipping = this.isSkipping && this.predicate(next.value, this.index++);
            if (!this.isSkipping) {
                return this.yield(next.value);
            }
        }
    }
}