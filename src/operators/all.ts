import { TyneqTerminalOperator } from "../core/terminal/TyneqTerminalOperator";
import { Enumerable } from "../types/core";
import { ItemPredicate } from "../types/utility";
import { ArgumentUtility } from "../utility/ArgumentUtility";

/**
 * Returns true if every element satisfies a predicate.
 *
 * @remarks
 * Immediate. Source is fully enumerated when this method is called.
 *
 * @see {@link TyneqSequence.all}
 * @group Operators
 * @category Terminal
 * @internal
 */
export class AllOperator<T> extends TyneqTerminalOperator<T, boolean> {
    private readonly predicate: ItemPredicate<T>;


    public constructor(source: Enumerable<T>, predicate: ItemPredicate<T>) {
        super(source);
        ArgumentUtility.checkNotOptional({ predicate });

        this.predicate = predicate;
    }

    public process(): boolean {
        let index = 0;
        for (const item of this.source) {
            if (!this.predicate(item, index++)) {
                return false;
            }
        }

        return true;
    }
}