import { ArgumentOutOfRangeError } from "../../core/errors/argument/ArgumentOutOfRangeError";
import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { ITyneqEnumerable } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

/**
 * Terminal operator implementation for retrieving an element at a specific index.
 * 
 * @remarks
 * This is a terminal operator that returns the element at the specified zero-based index.
 * Throws an error if the index is out of bounds.
 * 
 * **Performance**: O(1) space. O(index) time (enumerates up to the target index).
 * 
 * **Operator Category**: Terminal - forces partial evaluation and returns an element.
 * 
 * @typeParam TSource - The type of elements in the sequence.
 * 
 * @see {@link ITyneqEnumerable.elementAt} for the public API.
 */
export class ElementAtOperator<TSource> extends TyneqTerminalOperator<TSource, TSource> {
    /** The zero-based index of the element to retrieve. */
    private readonly index: number;

    /**
     * Creates a new elementAt operator.
     * 
     * @param source - The source sequence.
     * @param index - The zero-based index of the element to retrieve.
     * @throws {ArgumentError} If index is negative.
     */
    public constructor(source: ITyneqEnumerable<TSource>, index: number) {
        super(source);
        ArgumentUtility.checkNonNegative({ index });

        this.index = index;
    }

    public process(): TSource {
        const index = this.index;
        let currentIndex = 0;
        for (const element of this.source) {
            if (currentIndex === index) {
                return element;
            }

            currentIndex++;
        }

        throw new ArgumentOutOfRangeError(nameof({ index })[0]);
    }

}