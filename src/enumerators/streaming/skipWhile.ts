import { TyneqEnumerator } from "../../core/TyneqEnumerator";
import { EnumeratorResult, IEnumerator } from "../../types/core";

export class SkipWhileEnumerator<T> extends TyneqEnumerator<T> {
    private readonly predicate: (item: T) => boolean;

    private isSkipping = true;

    public constructor(sourceEnumerator: IEnumerator<T>, predicate: (item: T) => boolean) {
        super(sourceEnumerator);
        this.predicate = predicate;
    }

    protected override handleNext(): EnumeratorResult<T> {
        while (true) {
            const next = this.sourceEnumerator.next();
            if (next.done) {
                return this.complete();
            }

            this.isSkipping = this.isSkipping && this.predicate(next.value);
            if (!this.isSkipping) {
                return this.yield(next.value);
            }
        }
    }
}