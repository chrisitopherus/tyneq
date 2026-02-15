import { IEnumerable, IEnumerator, IteratorFactory } from "../..";
import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { SelectEnumerator } from "../../enumerators/streaming/select";

/**
 * Operator implementation for projecting each element using aselector function.
 * 
 * @remarks
 * This is a streaming operator that applies a transformation function to each element,
 * producing a new sequence of transformed values. Delegates enumeration logic to
 * {@link SelectEnumerator}.
 * 
 * **Performance**: O(1) space (streaming). O(n) time when fully enumerated.
 * 
 * **Operator Category**: Streaming - transforms elements one-at-a-time without buffering.
 * 
 * @typeParam TSource - The type of elements in the source sequence.
 * @typeParam TResult - The type of elements in the result sequence.
 * 
 * @see {@link SelectEnumerator} for the enumeration implementation.
 * @see {@link ITyneqEnumerable.select} for the public API.
 */
export class SelectOperatorEnumerable<TSource, TResult> extends TyneqOperatorEnumerable<TSource, TResult> {
    /** Function to transform each source element. */
    private readonly selector: (item: TSource) => TResult

    /**
     * Creates a new select (map/projection) operator.
     * 
     * @param source - The source sequence.
     * @param selector - Function to transform each element.
     */
    public constructor(source: IEnumerable<TSource>, selector: (item: TSource) => TResult) {
        super(source);
        this.selector = selector;
    }

    public getFactory(): IteratorFactory<TResult> {
        const source = this.source;
        const selector = this.selector;

        return () => {
            return new SelectEnumerator<TSource, TResult>(source[Symbol.iterator](), selector);
        }
    }

    public override getEnumerator(): IEnumerator<TResult> {
        return new SelectEnumerator<TSource, TResult>(this.source[Symbol.iterator](), this.selector);
    }
}