import { TyneqEnumerator } from "../../core/TyneqEnumerator";
import { EnumeratorResult, IEnumerator } from "../../types/core";

export class PrependEnumerator<T> extends TyneqEnumerator<T> {
    private prepended = false;
    private readonly item: T;

    public constructor(sourceEnumerator: IEnumerator<T>, item: T) {
        super(sourceEnumerator);
        this.item = item;
    }

    protected override handleNext(): EnumeratorResult<T> {
        if (!this.prepended) {
            this.prepended = true;
            return this.yield(this.item);
        }

        const nextItem = this.sourceEnumerator.next();
        if (!nextItem.done) {
            return this.yield(nextItem.value);
        }

        return this.complete();
    }
}