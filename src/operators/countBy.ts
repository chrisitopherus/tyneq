import { TyneqTerminalOperator } from "../core/terminal/TyneqTerminalOperator";
import { Enumerable } from "../types/core";
import { ItemPredicate } from "../types/utility";
import { ArgumentUtility } from "../utility/ArgumentUtility";

/**
 * Returns the number of elements that satisfy a predicate.
 *
 * @remarks
 * Immediate. Source is fully enumerated when this method is called.
 *
 * @see {@link TyneqSequence.countBy}
 * @group Operators
 * @category Terminal
 * @internal
 */
export class CountByOperator<T> extends TyneqTerminalOperator<T, number> {
    private readonly predicate: ItemPredicate<T>;

    public constructor(source: Enumerable<T>, predicate: ItemPredicate<T>) {
        super(source);
        ArgumentUtility.checkNotOptional({ predicate });
        this.predicate = predicate;
    }

    public process(): number {
        let count = 0;
        let index = 0;
        for (const item of this.source) {
            if (this.predicate(item, index++)) {
                count++;
            }
        }

        return count;
    }
}