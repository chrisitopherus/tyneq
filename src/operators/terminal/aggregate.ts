import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { IEnumerable } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

/**
 * Terminal operator implementation for applying an accumulator function over a sequence.
 * 
 * @remarks
 * This is a terminal operator that reduces a sequence to a single value by repeatedly
 * applying an accumulator function. Takes an initial seed value, processes all elements,
 * and applies a final result selector.
 * 
 * **Performance**: O(1) space. O(n) time (must enumerate all elements).
 * 
 * **Operator Category**: Terminal - forces evaluation and returns a value.
 *
 * This method uses immediate execution. The source sequence is fully enumerated when this method is called.
 *
 * @typeParam TSource - The type of elements in the source sequence.
 * @typeParam UAccumulate - The type of the accumulator value.
 * @typeParam VResult - The type of the final result.
 *
 * @see {@link ITyneqEnumerable.aggregate} for the public API.
 *
 * @group Operators
 * @category Terminal
 * @internal
 */
export class AggregateOperator<TSource, UAccumulate, VResult> extends TyneqTerminalOperator<TSource, VResult> {
    /** Initial accumulator value. */
    private readonly seed: UAccumulate;
    /** Function to accumulate elements into the accumulator. */
    private readonly func: (accumulate: UAccumulate, item: TSource) => UAccumulate;
    /** Function to transform the final accumulator to the result. */
    private readonly resultSelector: (accumulate: UAccumulate) => VResult;

    /**
     * Creates a new aggregate operator.
     * 
     * @param source - The source sequence.
     * @param seed - Initial accumulator value.
     * @param func - Function to accumulate each element.
     * @param resultSelector - Function to transform final accumulator to result.
     * @throws {ArgumentError} If func or resultSelector is null or undefined.
     */
    public constructor(
        source: IEnumerable<TSource>,
        seed: UAccumulate,
        func: (accumulate: UAccumulate, item: TSource) => UAccumulate,
        resultSelector: (accumulate: UAccumulate) => VResult
    ) {
        super(source);
        ArgumentUtility.checkNotOptional({ func });
        ArgumentUtility.checkNotOptional({ resultSelector });

        this.seed = seed;
        this.func = func;
        this.resultSelector = resultSelector;
    }

    public process(): VResult {
        let accumulate = this.seed;
        for (const item of this.source) {
            accumulate = this.func(accumulate, item);
        }

        return this.resultSelector(accumulate);
    }

}