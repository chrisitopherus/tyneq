import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from "../../types/core";
import { operator } from '../../extensibility/operatorDecorators';

/**
 * Enumerator that projects each element through a selector function.
 *
 * @remarks
 * This method uses deferred execution. The source sequence is not enumerated until the returned sequence is iterated.
 *
 * Applies the selector to each source element in order, yielding the transformed value.
 *
 * @typeParam T - The type of elements in the source sequence.
 * @typeParam U - The type of elements in the result sequence.
 *
 * @group Enumerators
 * @internal
 */
@operator('select')
export class SelectEnumerator<T, U> extends TyneqEnumerator<T, U> {
    private readonly selector: (item: T) => U;

    /**
     * @param sourceEnumerator - The upstream enumerator to wrap.
     * @param selector - Transforms each source element into the output type.
     */
    public constructor(sourceEnumerator: IEnumerator<T>, selector: (item: T) => U) {
        super(sourceEnumerator);
        this.selector = selector;
    }

    protected override handleNext(): IteratorResult<U> {
        const next = this.sourceEnumerator.next();
        if (next.done) {
            return this.done();
        }

        const value = next.value;
        return this.yield(this.selector(value));
    }
}
