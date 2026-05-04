import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";
import { ItemSelector } from "../../types/utility";

/**
 * Projects each element through a selector.
 *
 * @remarks
 * Deferred. Source is not enumerated until the returned sequence is iterated.
 *
 * @see {@link TyneqSequence.select}
 * @group Operators
 * @category Streaming
 * @internal
 */
export class SelectEnumerator<T, U> extends TyneqEnumerator<T, U> {
    private readonly selector: ItemSelector<T, U>;
    private index: number = 0;

    public constructor(sourceEnumerator: Enumerator<T>, selector: ItemSelector<T, U>) {
        super(sourceEnumerator);
        this.selector = selector;
    }

    protected override handleNext(): IteratorResult<U> {
        const next = this.sourceEnumerator.next();
        if (next.done) {
            return this.done();
        }

        return this.yield(this.selector(next.value, this.index++));
    }
}
