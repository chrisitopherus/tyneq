import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from "../../types/core";
import { operator } from '../../extensibility/operatorDecorators';

/**
 * Enumerator that appends a single element to the end of a sequence.
 *
 * @remarks
 * This method uses deferred execution. The source sequence is not enumerated until the returned sequence is iterated.
 *
 * Yields all source elements first, then the appended item.
 *
 * @typeParam T - The type of elements in the sequence.
 *
 * @group Enumerators
 * @internal
 */
@operator('append')
export class AppendEnumerator<T> extends TyneqEnumerator<T> {
    private isSourceDone = false;
    private appended = false;
    private readonly item: T;

    /**
     * @param sourceEnumerator - The upstream enumerator to wrap.
     * @param item - The element to append after all source elements.
     */
    public constructor(sourceEnumerator: IEnumerator<T>, item: T) {
        super(sourceEnumerator);
        this.item = item;
    }

    protected override handleNext(): IteratorResult<T> {
        if (!this.isSourceDone) {
            const sourceNext = this.sourceEnumerator.next();
            if (!sourceNext.done) {
                return this.yield(sourceNext.value);
            }

            this.isSourceDone = true;
        }

        if (!this.appended) {
            this.appended = true;
            return this.yield(this.item);
        }

        return this.done();
    }
}
