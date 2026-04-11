import { InvalidOperationError } from "../core/errors/InvalidOperationError";
import { TyneqTerminalOperator } from "../core/terminal/TyneqTerminalOperator";
import { TyneqSequence } from "../types/core";
import { ItemPredicate } from "../types/utility";
import { ArgumentUtility } from "../utility/ArgumentUtility";
import { nameof } from "../utility/nameof";

/**
 * Returns the first element matching a predicate, or throws if no match is found.
 *
 * @remarks
 * Immediate. Source is fully enumerated when this method is called.
 *
 * @see {@link TyneqSequence.first}
 * @group Operators
 * @category Terminal
 * @internal
 */
export class FirstOperator<TSource> extends TyneqTerminalOperator<TSource, TSource> {
    private readonly predicate: ItemPredicate<TSource>;


    public constructor(source: TyneqSequence<TSource>, predicate: ItemPredicate<TSource>) {
        super(source);
        ArgumentUtility.checkNotOptional({ predicate });
        this.predicate = predicate;
    }

    public process(): TSource {
        let index = 0;
        for (const element of this.source) {
            if (this.predicate(element, index++)) {
                return element;
            }
        }

        throw new InvalidOperationError("Sequence contains no matching element");
    }
}