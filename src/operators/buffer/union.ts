import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { UnionEnumerator } from "../../enumerators/buffer/union";
import { IEnumerable, IEnumerator, IteratorFactory } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";
import { operator } from "../../extensibility/operatorDecorators";

/**
 * Operator implementation for set union operation.
 * 
 * @remarks
 * This is a buffering operator that returns distinct elements from both sequences,
 * removing duplicates. Uses element equality (===) for comparison. Delegates enumeration
 * logic to {@link UnionEnumerator}.
 * 
 * **Performance**: O(n + m) time where n is source length and m is other values length.
 * O(n + m) space to deduplicate using a hash set.
 * 
 * **Operator Category**: Buffering - builds a hash set of all unique elements before yielding.
 *
 * **Registration method**: TC39 `@operator()` class decorator.
 *
 * This method uses deferred execution. The source sequence is fully buffered on first iteration of the returned sequence.
 *
 * @typeParam TSource - The type of elements in the sequences.
 *
 * @see {@link UnionEnumerator} for the enumeration implementation.
 * @see {@link ITyneqEnumerable.union} for the public API.
 *
 * @group Operators
 * @category Buffering
 * @internal
 */
@operator('union')
export class UnionOperatorEnumerable<TSource> extends TyneqOperatorEnumerable<TSource> {
    /** The second sequence to union with the source. */
    private readonly otherValues: Iterable<TSource>;

    /**
     * Creates a new set union operator.
     * 
     * @param source - The source sequence.
     * @param otherValues - The second sequence to union with.
     * 
     * @throws {@link ArgumentError} when `otherValues` is undefined.
     * @throws {@link ArgumentNullError} when `otherValues` is null.
     */
    public constructor(source: IEnumerable<TSource>, otherValues: Iterable<TSource>) {
        super(source);

        this.otherValues = otherValues;
    }

    public override getEnumerator(): IEnumerator<TSource> {
        return new UnionEnumerator<TSource>(this.source[Symbol.iterator](), this.otherValues);
    }
}