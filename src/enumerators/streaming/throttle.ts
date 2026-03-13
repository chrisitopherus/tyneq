import { TyneqEnumerator } from '../../core/enumerators/TyneqEnumerator';
import { IEnumerator } from '../../types/core';
import { ArgumentUtility } from '../../utility/argumentUtility';
import { operator } from '../../extensibility/operatorDecorators';

/**
 * Enumerator that yields every Nth element from a sequence.
 *
 * @remarks
 * This method uses deferred execution. The source sequence is not enumerated until the returned sequence is iterated.
 *
 * The element at index 0 is always yielded; subsequent elements are yielded at indices that are
 * multiples of `count` (0, count, 2×count, …).
 *
 * @typeParam T - The type of elements in the sequence.
 *
 * @group Enumerators
 * @internal
 */
@operator<[count: unknown]>('throttle', (count) => {
    ArgumentUtility.checkSafeInteger({ count: count as number });
    ArgumentUtility.checkPositive({ count: count as number });
})
export class ThrottleEnumerator<T> extends TyneqEnumerator<T> {
    private readonly count: number;
    private index: number = -1;

    /**
     * @param sourceEnumerator - The upstream enumerator to wrap.
     * @param count - Stride between yielded elements; must be a positive safe integer.
     */
    public constructor(sourceEnumerator: IEnumerator<T>, count: number) {
        super(sourceEnumerator);
        this.count = count;
    }

    protected override handleNext(): IteratorResult<T> {
        while (true) {
            const { value, done } = this.sourceEnumerator.next();
            if (done) {
                return this.done();
            }

            this.index++;
            if (this.index % this.count === 0) {
                return this.yield(value);
            }
        }
    }
}
