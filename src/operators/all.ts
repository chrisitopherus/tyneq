import { builtinTerminal } from "../extensions/builtinTerminal";
import { TyneqTerminalOperator } from "../core/TyneqTerminalOperator";
import { Enumerable } from "../types/core";
import { ArgumentUtility } from "../utility/argumentUtility";
import { nameof } from "../utility/nameof";

/**
 * Terminal operator that returns `true` if all elements satisfy a predicate.
 *
 * @remarks
 * This method uses immediate execution. The source sequence is fully enumerated when this method is called.
 *
 * Short-circuits on the first element that fails the predicate. Returns `true` for empty sequences.
 *
 * @typeParam T - The type of elements in the sequence.
 *
 * @see {@link TyneqSequence.all} for the public API.
 *
 * @group Operators
 * @category Terminal
 * @internal
 */
@builtinTerminal({ name: "all" })
export class AllOperator<T> extends TyneqTerminalOperator<T, boolean> {
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

    public process(): boolean {
        for (const item of this.source) {
            if (!this.predicate(item)) {
                return false;
            }
        }

        return true;
    }
}