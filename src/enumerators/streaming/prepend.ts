import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from "../../types/core";
import { operator } from '../../extensibility/operatorDecorators';

/**
 * Enumerator that prepends a single element to the beginning of a sequence.
 *
 * @remarks
 * This method uses deferred execution. The source sequence is not enumerated until the returned sequence is iterated.
 *
 * Yields the prepended item first, then all source elements.
 *
 * @typeParam T - The type of elements in the sequence.
 *
 * @group Enumerators
 * @internal
 */
@operator('prepend')
export class PrependEnumerator<T> extends TyneqEnumerator<T> {
    private prepended = false;
    private readonly item: T;

    /**
     * @param sourceEnumerator - The upstream enumerator to wrap.
     * @param item - The element to yield before all source elements.
     */
    public constructor(sourceEnumerator: IEnumerator<T>, item: T) {
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
