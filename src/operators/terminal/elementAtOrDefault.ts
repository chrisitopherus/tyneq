import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { ITyneqEnumerable } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

export class ElementAtOrDefaultOperator<TSource> extends TyneqTerminalOperator<TSource, TSource> {
    private readonly index: number;
    private readonly defaultValue: TSource;

    public constructor(source: ITyneqEnumerable<TSource>, index: number, defaultValue: TSource) {
        super(source);
        ArgumentUtility.checkNonNegative(index, nameof({ index }));

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