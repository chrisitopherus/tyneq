import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { SplitEnumerator } from "../../enumerators/streaming/split";
import { IEnumerable, IEnumerator, IteratorFactory } from "../../types/core";

/**
 * Operator implementation for splitting a sequence into chunks based on a separator predicate.
 * 
 * @remarks
 * This is a streaming operator that partitions the source sequence into arrays whenever
 * an element matches the separator predicate. Elements matching the predicate are excluded
 * from the result. Delegates enumeration logic to {@link SplitEnumerator}.
 * 
 * **Performance**: O(k) space where k is the size of each chunk. O(n) time when fully enumerated.
 * 
 * **Operator Category**: Streaming - yields chunks as they are completed without buffering entire sequence.
 * 
 * @typeParam TSource - The type of elements in the source sequence.
 * 
 * @see {@link SplitEnumerator} for the enumeration implementation.
 * @see {@link ITyneqEnumerable.split} for the public API.
 */
export class SplitOperatorEnumerable<TSource> extends TyneqOperatorEnumerable<TSource, TSource[]> {
    /** Predicate to identify separator elements (excluded from chunks). */
    private readonly predicate: (item: TSource) => boolean;

    /**
     * Creates a new split operator.
     * 
     * @param source - The source sequence.
     * @param predicate - Function to identify separator elements.
     */
    public constructor(source: IEnumerable<TSource>, predicate: (item: TSource) => boolean) {
        super(source);
        this.predicate = predicate;
    }

    public getFactory(): IteratorFactory<TSource[]> {
        const source = this.source;
        const predicate = this.predicate;

        return () => {
            return new SplitEnumerator<TSource>(source[Symbol.iterator](), predicate);
        }
    }

    public override getEnumerator(): IEnumerator<TSource[]> {
        return new SplitEnumerator<TSource>(this.source[Symbol.iterator](), this.predicate);
    }
}