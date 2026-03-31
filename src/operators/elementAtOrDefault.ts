import { TyneqTerminalOperator } from "../core/TyneqTerminalOperator";
import { TyneqSequence } from "../types/core";
import { ArgumentUtility } from "../utility/argumentUtility";
import { nameof } from "../utility/nameof";

/**
 * Returns the element at a specified index, or a default value if the index is out of range.
 *
 * @remarks
 * Immediate. Source is fully enumerated when this method is called.
 *
 * @see {@link TyneqSequence.elementAtOrDefault}
 * @group Operators
 * @category Terminal
 * @internal
 */
export class ElementAtOrDefaultOperator<TSource> extends TyneqTerminalOperator<TSource, TSource> {
    private readonly index: number;
    private readonly defaultValue: TSource;

    
    public constructor(source: TyneqSequence<TSource>, index: number, defaultValue: TSource) {
        super(source);
        ArgumentUtility.checkNonNegative({ index });

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