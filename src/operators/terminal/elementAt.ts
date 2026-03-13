import { ArgumentOutOfRangeError } from "../../core/errors/argument/ArgumentOutOfRangeError";
import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { terminal } from "../../extensibility/operatorDecorators";
import { ITyneqEnumerable } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

/**
 * Terminal operator that returns the element at a specified zero-based index.
 *
 * @remarks
 * This method uses immediate execution. The source sequence is fully enumerated when this method is called.
 *
 * Enumerates the source up to the target index. Throws if the index is out of range.
 *
 * @typeParam TSource - The type of elements in the sequence.
 *
 * @see {@link ITyneqEnumerable.elementAt} for the public API.
 *
 * @group Operators
 * @category Terminal
 * @internal
 */
@terminal<[index: unknown]>('elementAt', (index) => {
    ArgumentUtility.checkNonNegative({ index: index as number });
})
export class ElementAtOperator<TSource> extends TyneqTerminalOperator<TSource, TSource> {
    private readonly index: number;

    /**
     * @param source - The source sequence.
     * @param index - The zero-based index of the element to retrieve.
     */
    public constructor(source: ITyneqEnumerable<TSource>, index: number) {
        super(source);
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
