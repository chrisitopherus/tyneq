import { TyneqEnumerator } from "../../core/enumerator";
import { EnumeratorResult, IEnumerator } from "../../types/core";

export class OfTypeEnumerator<T, U> extends TyneqEnumerator<T, U> {
    private readonly guard: (value: T) => boolean;

    public constructor(sourceEnumerator: IEnumerator<T>, guard: (value: T) => boolean) {
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
                return this.yield(value as unknown as U);
            }
        }
    }
}