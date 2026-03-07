import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { IEnumerable } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

/**
 * Terminal operator implementation for computing the arithmetic mean of numeric values.
 * 
 * @remarks
 * This is a terminal operator that computes the average of numeric values extracted by
 * a selector function. Returns 0 for empty sequences. Must enumerate all elements.
 * 
 * **Performance**: O(1) space. O(n) time (must enumerate all elements).
 * 
 * **Operator Category**: Terminal - forces evaluation and returns a number.
 *
 * This method uses immediate execution. The source sequence is fully enumerated when this method is called.
 *
 * @typeParam T - The type of elements in the source sequence.
 *
 * @see {@link ITyneqEnumerable.average} for the public API.
 *
 * @group Operators
 * @category Terminal
 * @internal
 */
export class AverageOperator<T> extends TyneqTerminalOperator<T, number> {
    /** Function to extract numeric value from each element. */
    private readonly selector: (item: T) => number;

    /**
     * Creates a new average operator.
     * 
     * @param source - The source sequence.
     * @param selector - Function to extract numeric value from each element.
     * @throws {ArgumentError} If selector is null or undefined.
     */
    public constructor(source: IEnumerable<T>, selector: (item: T) => number) {
        super(source);
        ArgumentUtility.checkNotOptional({ selector });

        this.selector = selector;
    }

    public process(): number {
        let count = 0;
        let sum = 0;

        for (const item of this.source) {
            sum += this.selector(item);
            count++;
        }

        return count === 0 ? 0 : sum / count;
    }

}