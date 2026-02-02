import { TyneqEnumerator } from "../../core/TyneqEnumerator";
import { EnumeratorResult, IEnumerator } from "../../types/core";

export class DistinctByEnumerator<TSource, TKey> extends TyneqEnumerator<TSource> {
    private readonly seenValues = new Set<TKey>();
    private readonly keySelector: (item: TSource) => TKey;

    public constructor(sourceEnumerator: IEnumerator<TSource>, keySelector: (item: TSource) => TKey) {
        super(sourceEnumerator);
        this.keySelector = keySelector;
    }

    protected override handleNext(): EnumeratorResult<TSource> {
        while (true) {
            const { done, value } = this.sourceEnumerator.next();
            if (done) {
                return this.complete();
            }

            const key = this.keySelector(value);

            if (!this.seenValues.has(key)) {
                this.seenValues.add(key);
                return this.yield(value);
            }
        }
    }
}