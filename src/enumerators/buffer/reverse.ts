import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from "../../types/core";

export class ReverseEnumerator<T> extends TyneqEnumerator<T> {
    private buffer: T[] = [];
    private index: number = -1;
    private isDoneBuffering = false;

    public constructor(sourceEnumerator: IEnumerator<T>) {
        super(sourceEnumerator);
    }

    protected override handleNext(): IteratorResult<T> {
        if (!this.isDoneBuffering) {
            while (true) {
                const { done, value } = this.sourceEnumerator.next();
                if (done) {
                    this.index = this.buffer.length - 1;
                    this.isDoneBuffering = true;
                    break;
                }

                this.buffer.push(value);
            }
        }

        if (this.index < 0) {
            return this.done();
        }

        return this.yield(this.buffer[this.index--]);
    }
}