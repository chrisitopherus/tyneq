import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from "../../types/core";
import { operator } from '../../extensibility/operatorDecorators';

/**
 * Enumerator that yields elements in reverse order.
 *
 * @remarks
 * This method uses deferred execution. The source sequence is fully buffered on first iteration of the returned sequence.
 *
 * Consumes the entire source on first iteration to build a buffer, then yields elements
 * from the end backwards.
 *
 * @typeParam T - The type of elements in the sequence.
 *
 * @group Enumerators
 * @internal
 */
@operator('reverse')
export class ReverseEnumerator<T> extends TyneqEnumerator<T> {
    private buffer: T[] = [];
    private index: number = -1;

    /**
     * @param sourceEnumerator - The upstream enumerator to wrap.
     */
    public constructor(sourceEnumerator: IEnumerator<T>) {
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
