import { OrderedEnumerable } from "../../types/core";
import { Nullable } from "../../types/utility";
import { BaseEnumerableSorter } from "../../core/ordering/BaseEnumerableSorter";
import { TyneqBaseEnumerator } from "../../core/enumerators/TyneqBaseEnumerator";

/**
 * Yields the elements of an ordered sequence in sorted order.
 *
 * @remarks
 * Deferred. Source is fully buffered on the first iteration of the returned sequence.
 *
 * @see {@link TyneqSequence.orderBy}
 * @group Operators
 * @category Buffering
 * @internal
 */
export class OrderByEnumerator<TSource, _TKey> extends TyneqBaseEnumerator<TSource> {
    private buffer: TSource[] = [];
    private indexMap: number[] = [];
    private currentIndex = 0;
    private readonly orderedEnumerable: OrderedEnumerable<TSource>;

    public constructor(orderedEnumerable: OrderedEnumerable<TSource>) {
        super();
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

    private getSorter(base: OrderedEnumerable<TSource>): BaseEnumerableSorter<TSource> {
        let sorter: Nullable<BaseEnumerableSorter<TSource>> = null;
        for (let enumerable: Nullable<OrderedEnumerable<TSource>> = base; enumerable !== null; enumerable = enumerable.parent) {
            sorter = enumerable.getSorter(sorter);
        }

        return sorter!;
    }
}
