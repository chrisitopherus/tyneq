import { TyneqEnumerator } from "../../core/TyneqEnumerator";
import { IEnumerable, IEnumerator } from '../../types/core';

export class ExceptEnumerator<TSource> extends TyneqEnumerator<TSource> {
    private readonly excludedValues: IEnumerable<TSource>;
    private excludeSet = new Set<TSource>();
    private initialized = false;

    public constructor(sourceEnumerator: IEnumerator<TSource>, excludedValues: IEnumerable<TSource>) {
        super(sourceEnumerator);
        this.excludedValues = excludedValues;
    }

    protected override handleNext(): IteratorResult<TSource> {
        if (!this.initialized) {
            this.excludeSet = new Set<TSource>(this.excludedValues);
            this.initialized = true;
        }

        while (true) {
            const { done, value } = this.sourceEnumerator.next();
            if (done) {
                return this.complete();
            }

            if (!this.excludeSet.has(value)) {
                this.excludeSet.add(value);
                return this.yield(value);
            }
        }
    }
}