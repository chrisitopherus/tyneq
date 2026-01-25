import { TyneqEnumerator } from "../../core/enumerator";
import { EnumeratorResult, IEnumerator } from "../../types/core";

export class OfTypeEnumerator<T, U extends T> extends TyneqEnumerator<T, U> {
    private readonly guard: (value: T) => value is U;

    public constructor(sourceEnumerator: IEnumerator<T>, guard: (value: T) => value is U) {
        super(sourceEnumerator);
        this.guard = guard;
    }

    protected override handleNext(): EnumeratorResult<U> {
        while (true) {
            const { value, done } = this.sourceEnumerator.next();
            if (done) {
                return this.complete();
            }

            if (this.guard(value)) {
                return this.yield(value);
            }
        }
    }
}