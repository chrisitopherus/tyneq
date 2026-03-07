import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { ExceptEnumerator } from "../../enumerators/buffer/except";
import { IEnumerable, IEnumerator, IteratorFactory } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

/**
 * Operator implementation for set difference operation.
 * 
 * @remarks
 * This is a buffering operator that returns distinct elements from the source sequence
 * that do not appear in the excluded values sequence. Delegates the actual enumeration
 * logic to {@link ExceptEnumerator}.
 * 
 * **Performance**: O(n + m) time where n is source length and m is excluded values length.
 * O(m) space to index the excluded values in a hash set.
 * 
 * **Operator Category**: Buffering - builds a hash set of excluded values before yielding.
 *
 * This method uses deferred execution. The source sequence is fully buffered on first iteration of the returned sequence.
 *
 * @typeParam TSource - The type of elements in the sequences.
 *
 * @see {@link ExceptEnumerator} for the enumeration implementation.
 * @see {@link ITyneqEnumerable.except} for the public API.
 *
 * @group Operators
 * @category Buffering
 * @internal
 */
export class ExceptOperatorEnumerable<TSource> extends TyneqOperatorEnumerable<TSource> {
    /** Sequence of values to exclude from the result. */
    private readonly excludedValues: Iterable<TSource>;

    /**
     * Creates a new set difference operator.
     * 
     * @param source - The source sequence.
     * @param excludedValues - Sequence of values to exclude from results.
     * 
     * @throws {@link ArgumentError} when `excludedValues` is undefined.
     * @throws {@link ArgumentNullError} when `excludedValues` is null.
     */
    public constructor(source: IEnumerable<TSource>, excludedValues: Iterable<TSource>) {
        super(source);

        this.excludedValues = excludedValues;
    }

    /**
     * Returns a factory function that creates fresh enumerators for this operation.
     * 
     * @remarks
     * The factory captures both sequences and returns a function that produces
     * {@link ExceptEnumerator} instances. Each enumerator maintains independent state.
     * 
     * @returns A factory function producing except enumerators.
     */
    public getFactory(): IteratorFactory<TSource> {
        const source = this.source;
        const excludedValues = this.excludedValues;
        return () => {
            return new ExceptEnumerator<TSource>(source[Symbol.iterator](), excludedValues);
        }
    }

    /**
     * Creates a new enumerator for set difference enumeration.
     * 
     * @remarks
     * Delegates to {@link ExceptEnumerator} which builds a hash set of excluded values
     * and yields only source elements not in that set.
     * 
     * @returns A new enumerator positioned before the first element.
     */
    public override getEnumerator(): IEnumerator<TSource> {
        return new ExceptEnumerator<TSource>(this.source[Symbol.iterator](), this.excludedValues);
    }
}