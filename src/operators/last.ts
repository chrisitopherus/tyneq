import { InvalidOperationError } from "../core/errors/InvalidOperationError";
import { TyneqTerminalOperator } from "../core/terminal/TyneqTerminalOperator";
import { TyneqSequence } from "../types/core";
import { Nullable } from "../types/utility";
import { ArgumentUtility } from "../utility/ArgumentUtility";
import { nameof } from "../utility/nameof";

/**
 * Returns the last element matching a predicate, or throws if no match is found.
 *
 * @remarks
 * Immediate. Source is fully enumerated when this method is called.
 *
 * @see {@link TyneqSequence.last}
 * @group Operators
 * @category Terminal
 * @internal
 */
export class LastOperator<TSource> extends TyneqTerminalOperator<TSource, TSource> {
    private readonly predicate: (item: TSource) => boolean;

    
    public constructor(source: TyneqSequence<TSource>, predicate: (item: TSource) => boolean) {
        super(source);
        ArgumentUtility.checkNotOptional({ predicate });

        this.predicate = predicate;
    }

    public process(): TSource {
        let lastMatchingElement: Nullable<TSource> = null;
        let found = false;

        for (const element of this.source) {
            if (this.predicate(element)) {
                lastMatchingElement = element;
                found = true;
            }
        }

        if (!found) {
            throw new InvalidOperationError("Sequence contains no matching element");
        }

        return lastMatchingElement as TSource;
    }
}