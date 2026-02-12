import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from "../../types/core";

export class SelectEnumerator<T, U> extends TyneqEnumerator<T, U> {
    private readonly selector: (item: T) => U;

    public constructor(sourceEnumerator: IEnumerator<T>, selector: (item: T) => U) {
        super(sourceEnumerator);
        this.selector = selector;
    }

    protected override handleNext(): IteratorResult<U> {
        const next = this.sourceEnumerator.next();
        if (next.done) {
            return this.done();
        }

        const value = next.value;
        return this.yield(this.selector(value));
    }
}