import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { DistinctEnumerator } from "../../enumerators/buffer/distinct";
import { IEnumerable, IEnumerator, IteratorFactory } from "../../types/core";

/**
 * Operator implementation for filtering distinct elements from a sequence.
 * 
 * @remarks
 * This is a buffering operator that removes duplicate elements, keeping only the first
 * occurrence of each unique value. Delegates the actual enumeration logic to
 * {@link DistinctEnumerator}.
 * 
 * **Performance**: O(n) time, O(n) space. Must buffer all unique values in a hash set.
 * 
 * **Operator Category**: Buffering - maintains a hash set of seen elements during enumeration.
 * 
 * @typeParam TSource - The type of elements in the sequence.
 * 
 * @see {@link DistinctEnumerator} for the enumeration implementation.
 * @see {@link ITyneqEnumerable.distinct} for the public API.
 */
export class DistinctOperatorEnumerable<TSource> extends TyneqOperatorEnumerable<TSource> {
    /**
     * Creates a new distinct operator for the given source sequence.
     * 
     * @param source - The source sequence to filter for distinct elements.
     */
    public constructor(source: IEnumerable<TSource>) {
        super(source);
    }

    /**
     * Returns a factory function that creates fresh enumerators for this operation.
     * 
     * @remarks
     * The factory captures the source sequence and returns a function that produces
     * {@link DistinctEnumerator} instances. Each enumerator maintains independent state.
     * 
     * @returns A factory function producing distinct enumerators.
     */
    public getFactory(): IteratorFactory<TSource> {
        const source = this.source;
        return () => {
            return new DistinctEnumerator<TSource>(source[Symbol.iterator]());
        }
    }

    /**
     * Creates a new enumerator for distinct enumeration.
     * 
     * @remarks
     * Delegates to {@link DistinctEnumerator} which maintains a hash set of seen values
     * and yields only first occurrences.
     * 
     * @returns A new enumerator positioned before the first element.
     */
    public override getEnumerator(): IEnumerator<TSource> {
        return new DistinctEnumerator<TSource>(this.source[Symbol.iterator]());
    }
}