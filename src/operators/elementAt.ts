import { ArgumentOutOfRangeError } from "../core/errors/argument/ArgumentOutOfRangeError";
import { TyneqTerminalOperator } from "../core/terminal/TyneqTerminalOperator";
import { TyneqSequence } from "../types/core";
import { ArgumentUtility } from "../utility/ArgumentUtility";
import { nameof } from "../utility/nameof";

/**
 * Returns the element at a specified index, or throws if the index is out of range.
 *
 * @remarks
 * Immediate. Source is fully enumerated when this method is called.
 *
 * @see {@link TyneqSequence.elementAt}
 * @group Operators
 * @category Terminal
 * @internal
 */
export class ElementAtOperator<TSource> extends TyneqTerminalOperator<TSource, TSource> {
    private readonly index: number;

    
    public constructor(source: TyneqSequence<TSource>, index: number) {
        super(source);
        ArgumentUtility.checkNonNegative({ index });
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

        throw new ArgumentOutOfRangeError(nameof({ index })[0]);
    }

}