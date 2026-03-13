import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from "../../types/core";
import { operator } from '../../extensibility/operatorDecorators';

/**
 * Enumerator that yields elements while a predicate is true, then stops.
 *
 * @remarks
 * This method uses deferred execution. The source sequence is not enumerated until the returned sequence is iterated.
 *
 * Evaluates the predicate for each element. The first element that returns `false` causes early
 * completion; that element and all subsequent elements are not yielded.
 *
 * @typeParam T - The type of elements in the sequence.
 *
 * @group Enumerators
 * @internal
 */
@operator('takeWhile')
export class TakeWhileEnumerator<T> extends TyneqEnumerator<T> {
    private readonly predicate: (value: T) => boolean;

    /**
     * @param sourceEnumerator - The upstream enumerator to wrap.
     * @param predicate - Elements are yielded while this returns `true`.
     */
    public constructor(sourceEnumerator: IEnumerator<T>, predicate: (value: T) => boolean) {
        super(sourceEnumerator);
        this.predicate = predicate;
    }

    protected override handleNext(): IteratorResult<T> {
        const result = this.sourceEnumerator.next();
        if (result.done) {
            return this.done();
        }

        if (this.predicate(result.value)) {
            return this.yield(result.value);
        }

        return this.earlyComplete();
    }
}
