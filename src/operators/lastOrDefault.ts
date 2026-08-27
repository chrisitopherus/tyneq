import { TyneqTerminalOperator } from "../core/terminal/TyneqTerminalOperator";
import { TyneqSequence } from "../types/core";
import { ItemPredicate, Nullable } from "../types/utility";
import { ArgumentUtility } from "../utility/ArgumentUtility";

/**
 * Returns the last element matching a predicate, or a default value if no match is found.
 *
 * @remarks
 * Immediate. Source is fully enumerated when this method is called.
 *
 * @see {@link TyneqSequence.lastOrDefault}
 * @group Operators
 * @category Terminal
 * @internal
 */
export class LastOrDefaultOperator<TSource> extends TyneqTerminalOperator<TSource, TSource> {
    private readonly predicate: ItemPredicate<TSource>;
    private readonly defaultValue: TSource;

    public constructor(source: TyneqSequence<TSource>, predicate: ItemPredicate<TSource>, defaultValue: TSource) {
        super(source);
        ArgumentUtility.checkNotOptional({ predicate });

        this.predicate = predicate;
        this.defaultValue = defaultValue;
    }

    public process(): TSource {
        let lastMatchingElement: Nullable<TSource> = null;
        let found = false;
        let index = 0;

        for (const element of this.source) {
            if (this.predicate(element, index++)) {
                lastMatchingElement = element;
                found = true;
            }
        }

        if (!found) {
            return this.defaultValue;
        }

        return lastMatchingElement as TSource;
    }
}