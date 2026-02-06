import { TyneqEnumerator } from "../../core/TyneqEnumerator";
import { IEnumerator } from "../../types/core";

export class DistinctEnumerator<TSource> extends TyneqEnumerator<TSource> {
    private readonly seenValues = new Set<TSource>();

    public constructor(sourceEnumerator: IEnumerator<TSource>) {
        super(sourceEnumerator);
    }

    protected override handleNext(): IteratorResult<TSource> {
        while (true) {
            const { done, value } = this.sourceEnumerator.next();
            if (done) {
                return this.complete();
            }

            if (!this.seenValues.has(value)) {
                this.seenValues.add(value);
                return this.yield(value);
            }
        }
    }
}