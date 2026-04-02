import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";

/**
 * Prepends a single element to the beginning of the source sequence.
 *
 * @remarks
 * Deferred. Source is not enumerated until the returned sequence is iterated.
 *
 * @see {@link TyneqSequence.prepend}
 * @group Operators
 * @category Streaming
 * @internal
 */
export class PrependEnumerator<T> extends TyneqEnumerator<T> {
    private prepended = false;
    private readonly item: T;

    
    public constructor(sourceEnumerator: Enumerator<T>, item: T) {
        super(sourceEnumerator);
        this.item = item;
    }

    protected override handleNext(): IteratorResult<T> {
        if (!this.prepended) {
            this.prepended = true;
            return this.yield(this.item);
        }

        const nextItem = this.sourceEnumerator.next();
        if (!nextItem.done) {
            return this.yield(nextItem.value);
        }

        return this.done();
    }
}