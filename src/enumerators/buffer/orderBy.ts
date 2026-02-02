import { TyneqEnumerator } from "../../core/TyneqEnumerator";
import { EnumeratorResult, IEnumerator, IOrderedEnumerable } from '../../types/core';
import { Nullable } from "../../types/utility";
import { BaseEnumerableSorter } from "../../core/ordering/BaseEnumerableSorter";

export class OrderByEnumerator<TSource, TKey> extends TyneqEnumerator<TSource> {
    private isInitialized = false;
    private buffer: TSource[] = [];
    private indexMap: number[] = [];
    private currentIndex = 0;
    private readonly orderedEnumerable: IOrderedEnumerable<TSource>;

    public constructor(sourceEnumerator: IEnumerator<TSource>, orderedEnumerable: IOrderedEnumerable<TSource>) {
        super(sourceEnumerator);
        this.orderedEnumerable = orderedEnumerable;
    }

    protected handleNext(): EnumeratorResult<TSource> {
        if (!this.isInitialized) {
            this.buffer = Array.from(this.orderedEnumerable.source);
            const sorter = this.getSorter(this.orderedEnumerable);
            this.indexMap = sorter.sort(this.buffer, this.buffer.length);
            this.isInitialized = true;
        }

        if (this.currentIndex >= this.indexMap.length) {
            return this.complete();
        }

        const index = this.indexMap[this.currentIndex++]!;
        return this.yield(this.buffer[index]);
    }

    private getSorter(base: IOrderedEnumerable<TSource>): BaseEnumerableSorter<TSource> {
        let sorter: Nullable<BaseEnumerableSorter<TSource>> = null;
        for (let enumerable: Nullable<IOrderedEnumerable<TSource>> = base; enumerable !== null; enumerable = enumerable.parent) {
            sorter = enumerable.getSorter(sorter);
        }

        return sorter!;
    }
}