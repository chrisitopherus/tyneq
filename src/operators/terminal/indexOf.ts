import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { terminal } from "../../extensibility/operatorDecorators";
import { IEnumerable } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

/**
 * Terminal operator that returns the zero-based index of the first element satisfying a predicate.
 *
 * @remarks
 * This method uses immediate execution. The source sequence is fully enumerated when this method is called.
 *
 * Starts searching from `startIndex`. Short-circuits on the first match. Returns `-1` if no
 * element satisfies the predicate.
 *
 * @typeParam T - The type of elements in the sequence.
 *
 * @see {@link ITyneqEnumerable.indexOf} for the public API.
 *
 * @group Operators
 * @category Terminal
 * @internal
 */
@terminal("indexOf")
export class IndexOfOperator<T> extends TyneqTerminalOperator<T, number> {
    private readonly predicate: (item: T) => boolean;
    private readonly startIndex: number;

    /**
     * @param source - The source sequence.
     * @param predicate - The predicate tested against each element.
     * @param startIndex - The zero-based index at which to begin searching (default: `0`).
     * @throws {ArgumentError} If `predicate` is null or undefined, or `startIndex` is negative.
     */
    public constructor(source: IEnumerable<T>, predicate: (item: T) => boolean, startIndex: number = 0) {
        super(source);
        ArgumentUtility.checkNotOptional({ predicate });
        ArgumentUtility.checkNonNegative({ startIndex });

        this.predicate = predicate;
        this.startIndex = startIndex;
    }

    public process(): number {
        let index = -1;
        for (const item of this.source) {
            index++;
            if (index < this.startIndex) {
                continue;
            }

            if (this.predicate(item)) {
                return index;
            }
        }

        return -1;
    }

}
