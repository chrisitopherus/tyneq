import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator, IOrderedEnumerable } from '../../types/core';
import { Nullable } from "../../types/utility";
import { BaseEnumerableSorter } from "../../core/ordering/BaseEnumerableSorter";

/**
 * Enumerator implementation for yielding elements in sorted order.
 * 
 * @remarks
 * This enumerator consumes the entire source sequence on first iteration to build and sort
 * an array using a chain of sorters from the ordered enumerable. Supports multi-level sorting
 * via chained sorters (thenBy operations).
 * 
 * **Implementation**: Buffers all source elements into an array on first call, sorts using
 * index mapping, then yields in sorted order.
 * 
 * **Performance**: O(n) space for buffering and index map. O(n log n) time for sorting.
 * 
 * @typeParam TSource - The type of elements in the sequence.
 * @typeParam TKey - The type of the comparison key.
 * 
 *
 * @group Enumerators
 * @internal
 */
export class OrderByEnumerator<TSource, TKey> extends TyneqEnumerator<TSource> {
    /** Array containing all source elements. */
    private buffer: TSource[] = [];
    /** Sorted indices into the buffer array. */
    private indexMap: number[] = [];
    /** Current position in the sorted index map. */
    private currentIndex = 0;
    /** The ordered enumerable containing sorting configuration. */
    private readonly orderedEnumerable: IOrderedEnumerable<TSource>;

    /**
     * Creates a new orderBy enumerator.
     * 
     * @param sourceEnumerator - The source enumerator.
     * @param orderedEnumerable - The ordered enumerable with sorting configuration.
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

    /**
     * Gets the next element in sorted order.
     * On first call, consumes entire source and sorts.
     * 
     * @returns Iterator result containing the next sorted element, or done if exhausted.
     */
    protected override handleNext(): IteratorResult<TSource> {
        if (this.currentIndex >= this.indexMap.length) {
            return this.done();
        }

        const index = this.indexMap[this.currentIndex++];
        return this.yield(this.buffer[index]);
    }

    /**
     * Builds a composite sorter from the ordered enumerable chain.
     * 
     * @param base - The ordered enumerable to build sorter from.
     * @returns Composite sorter supporting multi-level sorting.
     */
    private getSorter(base: IOrderedEnumerable<TSource>): BaseEnumerableSorter<TSource> {
        let sorter: Nullable<BaseEnumerableSorter<TSource>> = null;
        for (let enumerable: Nullable<IOrderedEnumerable<TSource>> = base; enumerable !== null; enumerable = enumerable.parent) {
            sorter = enumerable.getSorter(sorter);
        }

        return sorter!;
    }
}