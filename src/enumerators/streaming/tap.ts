import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { operator } from '../../extensibility/operatorDecorators';

/**
 * Enumerator that executes a side-effect action on each element without modifying the sequence.
 *
 * @remarks
 * This method uses deferred execution. The source sequence is not enumerated until the returned sequence is iterated.
 *
 * Invokes `action` on each element before yielding it unchanged. Useful for logging,
 * debugging, or triggering external operations during enumeration.
 *
 * @typeParam TSource - The type of elements in the sequence.
 *
 * @group Enumerators
 * @internal
 */
@operator<[action: unknown]>('tap', (action) => {
    ArgumentUtility.checkNotOptional({ action });
})
export class TapEnumerator<TSource> extends TyneqEnumerator<TSource> {
    private readonly action: (item: TSource) => void;

    /**
     * @param sourceEnumerator - The upstream enumerator to wrap.
     * @param action - Called with each element as a side effect; must not be null or undefined.
     */
    public constructor(sourceEnumerator: IEnumerator<TSource>, action: (item: TSource) => void) {
        super(sourceEnumerator);
        this.action = action;
    }

    protected override handleNext(): IteratorResult<TSource> {
        const next = this.sourceEnumerator.next();
        if (next.done) {
            return this.done();
        }

        this.action(next.value);
        return this.yield(next.value);
    }
}
