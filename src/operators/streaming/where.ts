import { IEnumerable, IEnumerator, IteratorFactory } from "../..";
import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { WhereEnumerator } from "../../enumerators/streaming/where";

/**
 * Operator implementation for filtering elements based on a predicate.
 * 
 * @remarks
 * This is a streaming operator that yields only the elements that satisfy a predicate
 * function. Elements that fail the predicate are excluded from the result. Also known
 * as "filter". Delegates enumeration logic to {@link WhereEnumerator}.
 * 
 * **Performance**: O(1) space (streaming). O(n) time when fully enumerated.
 * 
 * **Operator Category**: Streaming - processes elements one-at-a-time without buffering.
 * 
 * @typeParam TSource - The type of elements in the sequence.
 * 
 * @see {@link WhereEnumerator} for the enumeration implementation.
 * @see {@link ITyneqEnumerable.where} for the public API.
 */
export class WhereOperatorEnumerable<TSource> extends TyneqOperatorEnumerable<TSource> {
    /** Predicate function to filter elements. */
    private readonly predicate: (item: TSource) => boolean;

    /**
     * Creates a new where (filter) operator.
     * 
     * @param source - The source sequence.
     * @param predicate - Function to test each element for inclusion.
     */
    public constructor(source: IEnumerable<TSource>, predicate: (item: TSource) => boolean) {
        super(source);
        this.predicate = predicate;
    }

    public getFactory(): IteratorFactory<TSource> {
        const source = this.source;
        const predicate = this.predicate;
        
        return () => {
            return new WhereEnumerator<TSource>(source[Symbol.iterator](), predicate);
        }
    }

    public override getEnumerator(): IEnumerator<TSource> {
        return new WhereEnumerator<TSource>(this.source[Symbol.iterator](), this.predicate);
    }
}