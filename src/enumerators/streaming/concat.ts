import { TyneqEnumerator } from "../../core/TyneqEnumerator";
import { IEnumerator } from "../../types/core";

export class ConcatEnumerator<T> extends TyneqEnumerator<T> {
    private readonly otherEnumerator: IEnumerator<T>;

    private isSourceDone = false;

    public constructor(sourceEnumerator: IEnumerator<T>, otherEnumerator: IEnumerator<T>) {
        super(sourceEnumerator);
        this.otherEnumerator = otherEnumerator;
    }

    protected override handleNext(): IteratorResult<T> {
        if (!this.isSourceDone) {
            const next = this.sourceEnumerator.next();
            if (!next.done) {
                return this.yield(next.value);
            }

            this.isSourceDone = true;
        }

        const next = this.otherEnumerator.next();
        if (!next.done) {
            return this.yield(next.value);
        }

        return this.complete();
    }
}