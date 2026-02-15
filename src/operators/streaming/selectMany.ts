import { IEnumerable, IEnumerator, IteratorFactory } from "../..";
import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { SelectManyEnumerator } from "../../enumerators/streaming/selectMany";

/**
 * Operator implementation for projecting and flattening nested sequences.
 * 
 * @remarks
 * This is a streaming operator that applies a selector function to each element,
 * obtaining a nested sequence, and flattens all nested sequences into a single
 * flat sequence. Also known as "flatMap". Delegates enumeration logic to
 * {@link SelectManyEnumerator}.
 * 
 * **Performance**: O(1) space (streaming). O(n + m) time when fully enumerated,
 * where n is source length and m is total length of all nested sequences.
 * 
 * **Operator Category**: Streaming - processes nested sequences one-at-a-time without buffering.
 * 
 * @typeParam TSource - The type of elements in the source sequence.
 * @typeParam TResult - The type of elements in the flattened result sequence.
 * 
 * @see {@link SelectManyEnumerator} for the enumeration implementation.
 * @see {@link ITyneqEnumerable.selectMany} for the public API.
 */
export class SelectManyOperatorEnumerable<TSource, TResult> extends TyneqOperatorEnumerable<TSource, TResult> {
    /** Function to project each element to a nested sequence. */
    private readonly selector: (item: TSource) => IEnumerable<TResult>;

    /**
     * Creates a new selectMany (flatMap) operator.
     * 
     * @param source - The source sequence.
     * @param selector - Function to project each element to a nested sequence.
     */
    public constructor(source: IEnumerable<TSource>, selector: (item: TSource) => IEnumerable<TResult>) {
        super(source);
        this.selector = selector;
    }

    public getFactory(): IteratorFactory<TResult> {
        const source = this.source;
        const selector = this.selector;

        return () => {
            return new SelectManyEnumerator<TSource, TResult>(source[Symbol.iterator](), selector);
        }
    }

    public override getEnumerator(): IEnumerator<TResult> {
        return new SelectManyEnumerator<TSource, TResult>(this.source[Symbol.iterator](), this.selector);
    }
}