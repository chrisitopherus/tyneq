import { TyneqEnumerator } from '../../core/enumerators/TyneqEnumerator';
import { IEnumerator } from '../../types/core';
import { ArgumentUtility } from '../../utility/argumentUtility';
import { operator } from '../../extensibility/operatorDecorators';

/**
 * Enumerator implementation for yielding every Nth element from a sequence.
 *
 * @remarks
 * Yields one element per every `count` source elements consumed. The first element
 * (index 0) is always yielded; subsequent yields occur at indices that are multiples
 * of `count` (0, count, 2×count, …).
 *
 * **Performance**: O(1) space (streaming). O(n) time when fully enumerated.
 *
 * @typeParam T - The type of elements in the sequence.
 *
 * @group Enumerators
 * @internal
 */
@operator('throttle', (count: number) => {
    ArgumentUtility.checkSafeInteger({ count });
    ArgumentUtility.checkPositive({ count });
})
export class ThrottleEnumerator<T> extends TyneqEnumerator<T> {
    private readonly count: number;
    private index: number = -1;
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