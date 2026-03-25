import { builtinTerminal } from "../extensions/builtinTerminal";
import { TyneqTerminalOperator } from "../core/TyneqTerminalOperator";
import { Enumerable } from "../types/core";

/**
 * Terminal operator that iterates through all elements of a sequence without collecting them.
 *
 * @remarks
 * Immediate. Source is enumerated on call.
 *
 * Useful for triggering side effects (e.g., via `tap`) without materializing the results.
 *
 * @see {@link TyneqSequence.consume} for the public API.
 *
 * @group Operators
 * @category Terminal
 * @internal
 */
@builtinTerminal({ name: "consume" })
export class ConsumeOperator<T> extends TyneqTerminalOperator<T, void> {
    public constructor(source: Enumerable<T>) {
        super(source);
    }

    public process(): void {
        for (const _ of this.source) {
            // intentionally consume all elements
        }
    }
}