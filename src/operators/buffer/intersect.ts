import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { IntersectEnumerator } from "../../enumerators/buffer/intersect";
import { IEnumerable, IEnumerator, IteratorFactory } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

/**
 * Operator implementation for set intersection operation.
 * 
 * @remarks
 * This is a buffering operator that returns distinct elements that appear in both sequences.
 * Uses element equality (===) for comparison. Delegates enumeration logic to
 * {@link IntersectEnumerator}.
 * 
 * **Performance**: O(n + m) time where n is source length and m is intersected values length.
 * O(m) space to index the intersected values in a hash set.
 * 
 * **Operator Category**: Buffering - builds a hash set of intersected values before yielding.
 * 
 * @typeParam TSource - The type of elements in the sequences.
 * 
 * @see {@link IntersectEnumerator} for the enumeration implementation.
 * @see {@link ITyneqEnumerable.intersect} for the public API.
 */
export class IntersectOperatorEnumerable<TSource> extends TyneqOperatorEnumerable<TSource> {
    /** Sequence of values that must appear in the result. */
    private readonly intersectedValues: Iterable<TSource>;

    /**
     * Creates a new set intersection operator.
     * 
     * @param source - The source sequence.
     * @param intersectedValues - Sequence of values that must appear in results.
     * 
     * @throws {@link ArgumentError} when `intersectedValues` is undefined.
     * @throws {@link ArgumentNullError} when `intersectedValues` is null.
     */
    public constructor(source: IEnumerable<TSource>, intersectedValues: Iterable<TSource>) {
        super(source);
        ArgumentUtility.checkNotOptional(intersectedValues, nameof({ intersectedValues }));
        ArgumentUtility.checkIterable(intersectedValues, nameof({ intersectedValues }));
        
        this.intersectedValues = intersectedValues;
    }

    public getFactory(): IteratorFactory<TSource> {
        const source = this.source;
        const intersectedValues = this.intersectedValues;
        return () => {
            return new IntersectEnumerator<TSource>(source[Symbol.iterator](), intersectedValues);
        }
    }

    public override getEnumerator(): IEnumerator<TSource> {
        return new IntersectEnumerator<TSource>(this.source[Symbol.iterator](), this.intersectedValues);
    }
}