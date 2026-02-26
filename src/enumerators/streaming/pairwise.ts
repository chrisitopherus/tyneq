import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from "../../types/core";

export class PairwiseEnumerator<T> extends TyneqEnumerator<T, [T, T]> {
    private hasPrevious = false;
    private previous!: T;

    public constructor(sourceEnumerator: IEnumerator<T>) {
        super(sourceEnumerator);
    }

    protected override handleNext(): IteratorResult<[T, T]> {
        while (true) {
            const next = this.sourceEnumerator.next();
            if (next.done) {
                return this.done();
            }

            if (!this.hasPrevious) {
                this.previous = next.value;
                this.hasPrevious = true;
                continue;
            }

            const pair: [T, T] = [this.previous, next.value];
            this.previous = next.value;
            return this.yield(pair);
        }
    }
}
