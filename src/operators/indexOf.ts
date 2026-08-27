import { TyneqTerminalOperator } from "../core/terminal/TyneqTerminalOperator";
import { Enumerable } from "../types/core";
import { ItemPredicate } from "../types/utility";
import { ArgumentUtility } from "../utility/ArgumentUtility";

/**
 * Returns the zero-based index of the first element matching a predicate, or -1 if not found.
 *
 * @remarks
 * Immediate. Short-circuits: stops enumerating the source as soon as a match is found.
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