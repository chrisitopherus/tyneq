import { builtinTerminal } from "../../extensibility/builtinTerminal";
import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { IEnumerable } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

/**
 * Terminal operator that reduces a sequence to a single value using an accumulator function.
 *
 * @remarks
 * This method uses immediate execution. The source sequence is fully enumerated when this method is called.
 *
 * Applies `func` to each element in turn, threading the accumulated value forward from `seed`.
 * Passes the final accumulated value through `resultSelector` to produce the result.
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
@builtinTerminal({ name: "aggregate" })
export class AggregateOperator<TSource, UAccumulate, VResult> extends TyneqTerminalOperator<TSource, VResult> {
    private readonly seed: UAccumulate;
    private readonly func: (accumulate: UAccumulate, item: TSource) => UAccumulate;
    private readonly resultSelector: (accumulate: UAccumulate) => VResult;

    /**
     * @param source - The source sequence.
     * @param seed - The initial accumulator value.
     * @param func - The accumulator applied to each element.
     * @param resultSelector - Transforms the final accumulator into the result.
     * @throws {ArgumentError} If `func` or `resultSelector` is null or undefined.
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