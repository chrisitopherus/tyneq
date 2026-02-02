import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { IEnumerable } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

export class AggregateOperator<TSource, UAccumulate, VResult> extends TyneqTerminalOperator<TSource, VResult> {
    private readonly seed: UAccumulate;
    private readonly func: (accumulate: UAccumulate, item: TSource) => UAccumulate;
    private readonly resultSelector: (accumulate: UAccumulate) => VResult;

    public constructor(
        source: IEnumerable<TSource>,
        seed: UAccumulate,
        func: (accumulate: UAccumulate, item: TSource) => UAccumulate,
        resultSelector: (accumulate: UAccumulate) => VResult
    ) {
        super(source);
        ArgumentUtility.checkNotOptional(func, nameof({ func }));
        ArgumentUtility.checkNotOptional(resultSelector, nameof({ resultSelector }));
        
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