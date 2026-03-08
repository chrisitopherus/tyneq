import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { terminal } from "../../extensibility/operatorDecorators";
import { IEnumerable } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

/**
 * Terminal operator implementation for counting elements that satisfy a predicate.
 *
 * @remarks
 * This is a terminal operator that returns the number of elements in the sequence
 * for which the predicate returns true. Must enumerate all elements.
 *
 * **Performance**: O(1) space. O(n) time (must enumerate all elements).
 *
 * **Operator Category**: Terminal - forces evaluation and returns a number.
 *
 * **Registration method**: TC39 `@terminal()` class decorator.
 *
 * This method uses immediate execution. The source sequence is fully enumerated when this method is called.
 *
 * @typeParam T - The type of elements in the sequence.
 *
 * @see {@link ITyneqEnumerable.countBy} for the public API.
 *
 * @group Operators
 * @category Terminal
 * @internal
 */
@terminal('countBy')
export class CountByOperator<T> extends TyneqTerminalOperator<T, number> {
    private readonly predicate: (item: T) => boolean;

    public constructor(source: IEnumerable<T>, predicate: (item: T) => boolean) {
        super(source);
        ArgumentUtility.checkNotOptional({ predicate });
        this.predicate = predicate;
    }

    public process(): number {
        let count = 0;
        for (const item of this.source) {
            if (this.predicate(item)) {
                count++;
            }
        }

        return count;
    }
}
