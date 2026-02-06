import { TyneqEnumerator } from "../../core/TyneqEnumerator";
import { IEnumerable, IEnumerator } from '../../types/core';

export class IntersectEnumerator<TSource> extends TyneqEnumerator<TSource> {
    private readonly otherValues: IEnumerable<TSource>;
    private intersectionValues = new Set<TSource>();
    private bufferedValues = new Set<TSource>();
    private initialized = false;

    public constructor(sourceEnumerator: IEnumerator<TSource>, otherValues: IEnumerable<TSource>) {
        super(sourceEnumerator);
        this.otherValues = otherValues;
    }

    protected override handleNext(): IteratorResult<TSource> {
        if (!this.initialized) {
            this.intersectionValues = new Set<TSource>(this.otherValues);
            this.initialized = true;
        }

        while (true) {
            const { done, value } = this.sourceEnumerator.next();
            if (done) {
                return this.complete();
            }

            if (this.intersectionValues.has(value) && !this.bufferedValues.has(value)) {
                this.bufferedValues.add(value);
                return this.yield(value);
            }
        }
    }
}