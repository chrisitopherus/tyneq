import type { IEnumerable, IEnumerator } from "../../types/core";
import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { createGeneratorOperator } from '../../extensibility/createOperator';
import { SelectEnumerator } from "../../enumerators/streaming/select";

/**
 * Operator implementation for projecting each element using a selector function.
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
 * **Registration method**: `createGeneratorOperator()` — the simplest functional approach.
 * A generator function wraps the class-based enumerator, demonstrating that both
 * class and generator implementations coexist cleanly.
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

    public override getEnumerator(): IEnumerator<TResult> {
        return new SelectEnumerator<TSource, TResult>(this.source[Symbol.iterator](), this.selector);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Registration — createGeneratorOperator()
// ─────────────────────────────────────────────────────────────────────────────
//  Demonstrates using the lowest-ceremony functional API.
//  The generator delegates to the existing class-based enumerator internally,
//  but could also be a pure inline generator for simpler operators.
// ─────────────────────────────────────────────────────────────────────────────

createGeneratorOperator<any, any, [(item: any) => any]>({
    name: 'select',
    *generator(source: Iterable<any>, selector: (item: any) => any): IterableIterator<any> {
        for (const item of source) {
            yield selector(item);
        }
    }
});