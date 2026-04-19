import { TyneqTerminalOperator } from "../core/terminal/TyneqTerminalOperator";
import { Enumerable } from "../types/core";
import { ItemPredicate } from "../types/utility";
import { ArgumentUtility } from "../utility/ArgumentUtility";
import { nameof } from "../utility/nameof";

/**
 * Returns the zero-based index of the first element matching a predicate, or -1 if not found.
 *
 * @remarks
 * Immediate. Source is fully enumerated when this method is called.
 *
 * @see {@link TyneqSequence.indexOf}
 * @group Operators
 * @category Terminal
 * @internal
 */
export class IndexOfOperator<T> extends TyneqTerminalOperator<T, number> {
    private readonly predicate: ItemPredicate<T>;
    private readonly startIndex: number;


    public constructor(source: Enumerable<T>, predicate: ItemPredicate<T>, startIndex: number = 0) {
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

            if (this.predicate(item, index)) {
                return index;
            }
        }

        return -1;
    }
}