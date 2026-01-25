
import { TerminalOperator } from "../../core/terminalOperator";
import { IEnumerable } from "../../types/core";

export class AggregateOperator<TSource, UAccumulate, VResult> extends TerminalOperator<TSource, VResult> {
    private readonly seed: UAccumulate;
    private readonly func: (accumulate: UAccumulate, item: TSource) => UAccumulate;
    private readonly resultSelector: (accumulate: UAccumulate) => VResult;

    public constructor(
        source: IEnumerable<TSource>, seed: UAccumulate,
        func: (accumulate: UAccumulate, item: TSource) => UAccumulate,
        resultSelector: (accumulate: UAccumulate) => VResult
    ) {
        super(source);
        this.seed = seed;
        this.func = func;
        this.resultSelector = resultSelector;
    }

    public process(): VResult {
        let accumulate = this.seed;
        const enumerator = this.source[Symbol.iterator]();

        while (true) {
            const { done, value } = enumerator.next();
            if (done) {
                return this.resultSelector(accumulate);
            }

            accumulate = this.func(accumulate, value);
        }
    }

}