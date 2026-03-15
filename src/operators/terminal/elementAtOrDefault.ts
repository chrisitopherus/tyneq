import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { terminal } from "../../extensibility/operatorDecorators";
import { ITyneqEnumerable } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

/**
 * Terminal operator that returns the element at a specified zero-based index, or a default value if out of range.
 *
 * @remarks
 * This method uses immediate execution. The source sequence is fully enumerated when this method is called.
 *
 * Enumerates the source up to the target index. Returns `defaultValue` rather than throwing
 * when the index is out of range.
 *
 * @typeParam TSource - The type of elements in the sequence.
 *
 * @see {@link ITyneqEnumerable.elementAtOrDefault} for the public API.
 *
 * @group Operators
 * @category Terminal
 * @internal
 */
@terminal("elementAtOrDefault")
export class ElementAtOrDefaultOperator<TSource> extends TyneqTerminalOperator<TSource, TSource> {
    private readonly index: number;
    private readonly defaultValue: TSource;

    /**
     * @param source - The source sequence.
     * @param index - The zero-based index of the element to retrieve.
     * @param defaultValue - The value returned when `index` is out of range.
     * @throws {ArgumentError} If `index` is negative.
     */
    public constructor(source: ITyneqEnumerable<TSource>, index: number, defaultValue: TSource) {
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
