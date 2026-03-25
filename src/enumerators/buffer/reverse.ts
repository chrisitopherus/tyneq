import { builtinOperator } from "../../extensions/builtinOperator";
import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";

/**
 * Enumerator that yields elements in reverse order.
 *
 * @remarks
 * Deferred. Source is fully buffered on first iteration.
 *
 * Consumes the entire source on first iteration to build a buffer, then yields elements
 * from the end backwards.
 *
 * @group Enumerators
 * @internal
 */
@builtinOperator({ name: "reverse", kind: "buffer" })
export class ReverseEnumerator<T> extends TyneqEnumerator<T> {
    private buffer: T[] = [];
    private index: number = -1;

    /**
     * @param sourceEnumerator - The upstream enumerator to wrap.
     */
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