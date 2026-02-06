import { TyneqEnumerator } from "../../core/TyneqEnumerator";
import { IEnumerator } from "../../types/core";

export class TakeWhileEnumerator<T> extends TyneqEnumerator<T> {
    private readonly predicate: (value: T) => boolean;

    public constructor(sourceEnumerator: IEnumerator<T>, predicate: (value: T) => boolean) {
        super(sourceEnumerator);
        this.predicate = predicate;
    }

    protected override handleNext(): IteratorResult<T> {
        const result = this.sourceEnumerator.next();
        if (result.done) {
            return this.complete();
        }

        if (this.predicate(result.value)) {
            return this.yield(result.value);
        }

        return this.complete();
    }
}