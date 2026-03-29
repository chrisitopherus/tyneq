import { builtinTerminal } from "../plugin/builtinTerminal";
import { TyneqTerminalOperator } from "../core/TyneqTerminalOperator";
import { Enumerable } from "../types/core";
import { ArgumentUtility } from "../utility/argumentUtility";
import { nameof } from "../utility/nameof";

/**
 * Returns the sum of all elements projected through a selector.
 *
 * @remarks
 * Immediate. Source is fully enumerated when this method is called.
 *
 * @see {@link TyneqSequence.sum}
 * @group Operators
 * @category Terminal
 * @internal
 */
@builtinTerminal({ name: "sum" })
export class SumOperator<T> extends TyneqTerminalOperator<T, number> {
    private readonly selector: (item: T) => number;

    
    public constructor(source: Enumerable<T>, selector: (item: T) => number) {
        super(source);
        ArgumentUtility.checkNotOptional({ selector });

        this.selector = selector;
    }

    public process(): number {
        let sum = 0;

        for (const item of this.source) {
            sum += this.selector(item);
        }

        return sum;
    }
}