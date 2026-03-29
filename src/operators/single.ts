import { builtinTerminal } from "../plugin/builtinTerminal";
import { InvalidOperationError } from "../core/errors/InvalidOperationError";
import { TyneqTerminalOperator } from "../core/TyneqTerminalOperator";
import { TyneqSequence } from "../types/core";
import { Nullable } from "../types/utility";
import { ArgumentUtility } from "../utility/argumentUtility";
import { nameof } from "../utility/nameof";

/**
 * Returns the single element matching a predicate, or throws if there is not exactly one match.
 *
 * @remarks
 * Immediate. Source is fully enumerated when this method is called.
 *
 * @see {@link TyneqSequence.single}
 * @group Operators
 * @category Terminal
 * @internal
 */
@builtinTerminal({ name: "single" })
export class SingleOperator<TSource> extends TyneqTerminalOperator<TSource, TSource> {
    private readonly predicate: (item: TSource) => boolean;

    
    public constructor(source: TyneqSequence<TSource>, predicate: (item: TSource) => boolean) {
        super(source);
        ArgumentUtility.checkNotOptional({ predicate });

        this.predicate = predicate;
    }

    public process(): TSource {
        let found = false;
        let single: Nullable<TSource> = null;
        for (const element of this.source) {
            if (this.predicate(element)) {
                if (found) {
                    throw new InvalidOperationError("Sequence contains more than one matching element");
                }

                found = true;
                single = element;
            }
        }

        if (!found) {
            throw new InvalidOperationError("Sequence contains no matching element");
        }

        return single as TSource;
    }
}