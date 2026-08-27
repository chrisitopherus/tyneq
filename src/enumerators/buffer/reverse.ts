import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";

/**
 * Reverses the order of elements in the source sequence.
 *
 * @remarks
 * Deferred. Source is fully buffered on the first iteration of the returned sequence.
 *
 * @see {@link TyneqSequence.reverse}
 * @group Operators
 * @category Buffering
 * @internal
 */
export class ReverseEnumerator<T> extends TyneqEnumerator<T> {
    private buffer: T[] = [];
    private index: number = -1;

    public constructor(sourceEnumerator: Enumerator<T>) {
        super(sourceEnumerator);
    }

    protected override initialize(): void {
        while (true) {
            const { done, value } = this.sourceEnumerator.next();
            if (done) {
                this.index = this.buffer.length - 1;
                break;
            }

            this.buffer.push(value);
        }
    }

    protected override handleNext(): IteratorResult<T> {
        if (this.index < 0) {
            return this.done();
        }

        return this.yield(this.buffer[this.index--]);
    }
}