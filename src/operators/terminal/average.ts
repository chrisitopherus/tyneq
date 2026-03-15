import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { terminal } from "../../extensibility/operatorDecorators";
import { IEnumerable } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

/**
 * Terminal operator that computes the arithmetic mean of numeric values in a sequence.
 *
 * @remarks
 * This method uses immediate execution. The source sequence is fully enumerated when this method is called.
 *
 * Applies `selector` to each element and returns the average. Returns `0` for empty sequences.
 *
 * @typeParam T - The type of elements in the source sequence.
 *
 * @see {@link ITyneqEnumerable.average} for the public API.
 *
 * @group Operators
 * @category Terminal
 * @internal
 */
@terminal("average")
export class AverageOperator<T> extends TyneqTerminalOperator<T, number> {
    private readonly selector: (item: T) => number;

    /**
     * @param source - The source sequence.
     * @param selector - Extracts a numeric value from each element.
     * @throws {ArgumentError} If `selector` is null or undefined.
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
