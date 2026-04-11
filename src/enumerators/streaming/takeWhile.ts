import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";
import { ItemPredicate } from "../../types/utility";
import { ArgumentUtility } from "../../utility/ArgumentUtility";

/**
 * Yields elements from the beginning of the source sequence as long as a predicate is true.
 *
 * @remarks
 * Deferred. Source is not enumerated until the returned sequence is iterated.
 *
 * @see {@link TyneqSequence.takeWhile}
 * @group Operators
 * @category Streaming
 * @internal
 */
export class TakeWhileEnumerator<T> extends TyneqEnumerator<T> {
    private readonly predicate: ItemPredicate<T>;
    private index: number = 0;


    public constructor(sourceEnumerator: Enumerator<T>, predicate: ItemPredicate<T>) {
        super(sourceEnumerator);
        this.predicate = predicate;
    }

    protected override handleNext(): IteratorResult<T> {
        const result = this.sourceEnumerator.next();
        if (result.done) {
            return this.done();
        }

        if (this.predicate(result.value, this.index++)) {
            return this.yield(result.value);
        }

        return this.earlyComplete();
    }
}