import { builtinTerminal } from "../plugin/builtinTerminal";
import { TyneqTerminalOperator } from "../core/TyneqTerminalOperator";
import { Enumerable } from "../types/core";
import { ArgumentUtility } from "../utility/argumentUtility";
import { nameof } from "../utility/nameof";

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
@builtinTerminal({ name: "all" })
export class AllOperator<T> extends TyneqTerminalOperator<T, boolean> {
    private readonly predicate: (item: T) => boolean;

    
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