import { ArgumentOutOfRangeError } from "../../core/errors/argument/ArgumentOutOfRangeError";
import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { ITyneqEnumerable } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

export class ElementAtOperator<TSource> extends TyneqTerminalOperator<TSource, TSource> {
    private readonly index: number;

    public constructor(source: ITyneqEnumerable<TSource>, index: number) {
        super(source);
        ArgumentUtility.checkNonNegative(index, nameof({ index }));

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

        throw new ArgumentOutOfRangeError(nameof({ index }));
    }

}