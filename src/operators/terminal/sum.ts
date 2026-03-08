import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { terminal } from "../../extensibility/operatorDecorators";
import { IEnumerable } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

/**
 * Terminal operator implementation for computing the sum of numeric values.
 * 
 * @remarks
 * This is a terminal operator that computes the sum of numeric values extracted by a
 * selector function. Returns 0 for empty sequences. Must enumerate all elements.
 * 
 * **Performance**: O(1) space. O(n) time (must enumerate all elements).
 * 
 * **Operator Category**: Terminal - forces full evaluation and returns a number.
 *
 * **Registration method**: TC39 `@terminal()` class decorator.
 *
 * This method uses immediate execution. The source sequence is fully enumerated when this method is called.
 *
 * @typeParam T - The type of elements in the source sequence.
 *
 * @see {@link ITyneqEnumerable.sum} for the public API.
 *
 * @group Operators
 * @category Terminal
 * @internal
 */
@terminal('sum')
export class SumOperator<T> extends TyneqTerminalOperator<T, number> {
    /** Function to extract numeric value from each element. */
    private readonly selector: (item: T) => number;

    /**
     * Creates a new sum operator.
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
        let sum = 0;

        for (const item of this.source) {
            sum += this.selector(item);
        }

        return sum;
    }
}