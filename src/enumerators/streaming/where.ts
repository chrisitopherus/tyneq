import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";
import { ItemPredicate } from "../../types/utility";
import { ArgumentUtility } from "../../utility/ArgumentUtility";

/**
 * Filters elements using a predicate.
 *
 * @remarks
 * Deferred. Source is not enumerated until the returned sequence is iterated.
 *
 * @see {@link TyneqSequence.where}
 * @group Operators
 * @category Streaming
 * @internal
 */
export class WhereEnumerator<T> extends TyneqEnumerator<T> {
    private index: number = 0;
    private readonly predicate: ItemPredicate<T>;

    public constructor(sourceEnumerator: Enumerator<T>, predicate: ItemPredicate<T>) {
        super(sourceEnumerator);
        this.predicate = predicate;
    }

    protected override handleNext(): IteratorResult<T> {
        while (true) {
            const { value, done } = this.sourceEnumerator.next();
            if (done) {
                return this.done();
            }

            if (this.predicate(value, this.index++)) {
                return this.yield(value);
            }
        }
    }
}
