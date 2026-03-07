import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { ITyneqEnumerable } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

/**
 * Terminal operator implementation for retrieving an element at a specific index with a default.
 * 
 * @remarks
 * This is a terminal operator that returns the element at the specified zero-based index,
 * or a default value if the index is out of bounds. Does not throw exceptions.
 * 
 * **Performance**: O(1) space. O(index) time (enumerates up to the target index).
 * 
 * **Operator Category**: Terminal - forces partial evaluation and returns an element.
 *
 * This method uses immediate execution. The source sequence is fully enumerated when this method is called.
 *
 * @typeParam TSource - The type of elements in the sequence.
 *
 * @see {@link ITyneqEnumerable.elementAtOrDefault} for the public API.
 *
 * @group Operators
 * @category Terminal
 * @internal
 */
export class ElementAtOrDefaultOperator<TSource> extends TyneqTerminalOperator<TSource, TSource> {
    /** The zero-based index of the element to retrieve. */
    private readonly index: number;
    /** The value to return if index is out of bounds. */
    private readonly defaultValue: TSource;

    /**
     * Creates a new elementAtOrDefault operator.
     * 
     * @param source - The source sequence.
     * @param index - The zero-based index of the element to retrieve.
     * @param defaultValue - The value to return if index is out of bounds.
     * @throws {ArgumentError} If index is negative.
     */
    public constructor(source: ITyneqEnumerable<TSource>, index: number, defaultValue: TSource) {
        super(source);
        ArgumentUtility.checkNonNegative({ index });

        this.index = index;
        this.defaultValue = defaultValue;
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

        return this.defaultValue;
    }

}