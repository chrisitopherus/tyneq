import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator, IOrderedEnumerable } from '../../types/core';
import { Nullable } from "../../types/utility";
import { BaseEnumerableSorter } from "../../core/ordering/BaseEnumerableSorter";

/**
 * Enumerator that yields elements in sorted order.
 *
 * @remarks
 * This method uses deferred execution. The source sequence is fully buffered on first iteration of the returned sequence.
 *
 * Consumes the entire source on first iteration to build a sorted index map using a chain of
 * sorters from the ordered enumerable. Supports multi-level sorting via chained sorters
 * produced by `thenBy` operations.
 *
 * @typeParam TSource - The type of elements in the sequence.
 * @typeParam TKey - The type of the comparison key.
 *
 * @group Enumerators
 * @internal
 */
export class OrderByEnumerator<TSource, TKey> extends TyneqEnumerator<TSource> {
    private buffer: TSource[] = [];
    private indexMap: number[] = [];
    private currentIndex = 0;
    private readonly orderedEnumerable: IOrderedEnumerable<TSource>;

    /**
     * @param sourceEnumerator - The upstream enumerator to wrap.
     * @param orderedEnumerable - The ordered enumerable carrying the sorting configuration.
     */
    public constructor(sourceEnumerator: IEnumerator<TSource>, orderedEnumerable: IOrderedEnumerable<TSource>) {
        super(sourceEnumerator);
        this.orderedEnumerable = orderedEnumerable;
    }

    protected override initialize(): void {
        this.buffer = Array.from(this.orderedEnumerable.source);
        const sorter = this.getSorter(this.orderedEnumerable);
        this.indexMap = sorter.sort(this.buffer, this.buffer.length);
    }

    protected override handleNext(): IteratorResult<TSource> {
        if (this.currentIndex >= this.indexMap.length) {
            return this.done();
        }

        const index = this.indexMap[this.currentIndex++];
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
