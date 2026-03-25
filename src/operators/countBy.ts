import { builtinTerminal } from "../extensions/builtinTerminal";
import { TyneqTerminalOperator } from "../core/TyneqTerminalOperator";
import { Enumerable } from "../types/core";
import { ArgumentUtility } from "../utility/argumentUtility";
import { nameof } from "../utility/nameof";

/**
 * Terminal operator that counts the elements in a sequence that satisfy a predicate.
 *
 * @remarks
 * This method uses immediate execution. The source sequence is fully enumerated when this method is called.
 *
 * @typeParam T - The type of elements in the sequence.
 *
 * @see {@link TyneqSequence.countBy} for the public API.
 *
 * @group Operators
 * @category Terminal
 * @internal
 */
@builtinTerminal({ name: "countBy" })
export class CountByOperator<T> extends TyneqTerminalOperator<T, number> {
    private readonly predicate: (item: T) => boolean;

    /**
     * @param source - The source sequence.
     * @param predicate - The predicate tested against each element.
     * @throws {ArgumentError} If `predicate` is null or undefined.
     */
    public constructor(source: Enumerable<T>, predicate: (item: T) => boolean) {
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