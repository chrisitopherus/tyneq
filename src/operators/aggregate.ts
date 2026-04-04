import { TyneqTerminalOperator } from "../core/terminal/TyneqTerminalOperator";
import { Enumerable } from "../types/core";
import { ArgumentUtility } from "../utility/ArgumentUtility";
import { nameof } from "../utility/nameof";

/**
 * Applies an accumulator over the sequence and transforms the final result through a selector.
 *
 * @remarks
 * Immediate. Source is fully enumerated when this method is called.
 *
 * @see {@link TyneqSequence.aggregate}
 * @group Operators
 * @category Terminal
 * @internal
 */
export class AggregateOperator<TSource, UAccumulate, VResult> extends TyneqTerminalOperator<TSource, VResult> {
    private readonly seed: UAccumulate;
    private readonly func: (accumulate: UAccumulate, item: TSource) => UAccumulate;
    private readonly resultSelector: (accumulate: UAccumulate) => VResult;

    
    public constructor(
        source: Enumerable<TSource>,
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