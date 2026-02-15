import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { Tyneq } from "../../core/tyneq";
import { IEnumerator, ITyneqEnumerable } from "../../types/core";

/**
 * Terminal operator implementation for providing a default value if sequence is empty.
 * 
 * @remarks
 * This is a terminal operator that returns the original sequence if it contains elements,
 * or a single-element sequence containing the default value if empty. Checks emptiness
 * by attempting to get the first element.
 * 
 * **Performance**: O(1) space. O(1) time (only checks first element).
 * 
 * **Operator Category**: Terminal - forces partial evaluation and returns an enumerable.
 * 
 * @typeParam TSource - The type of elements in the sequence.
 * 
 * @see {@link ITyneqEnumerable.defaultIfEmpty} for the public API.
 */
export class DefaultIfEmptyOperator<TSource> extends TyneqTerminalOperator<TSource, ITyneqEnumerable<TSource>> {
    /** The default value to return if sequence is empty. */
    private readonly defaultValue: TSource;

    /**
     * Creates a new defaultIfEmpty operator.
     * 
     * @param source - The source sequence.
     * @param defaultValue - The value to return if sequence is empty.
     */
    public constructor(source: ITyneqEnumerable<TSource>, defaultValue: TSource) {
        super(source);
        this.defaultValue = defaultValue;
    }
    public process(): ITyneqEnumerable<TSource> {
        const enumerator: IEnumerator<TSource> = this.source[Symbol.iterator]();
        const { done } = enumerator.next();

        if (done) {
            return Tyneq.from([this.defaultValue]);
        }

        // assertion is safe here because we assign an ITyneqEnumerable<TSource> in the constructor.
        return this.source as ITyneqEnumerable<TSource>;
    }

}