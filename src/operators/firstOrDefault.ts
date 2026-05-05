import { TyneqTerminalOperator } from "../core/terminal/TyneqTerminalOperator";
import { TyneqSequence } from "../types/core";
import { ItemPredicate } from "../types/utility";
import { ArgumentUtility } from "../utility/ArgumentUtility";

/**
 * Returns the first element matching a predicate, or a default value if no match is found.
 *
 * @remarks
 * Immediate. Source is fully enumerated when this method is called.
 *
 * @see {@link TyneqSequence.firstOrDefault}
 * @group Operators
 * @category Terminal
 * @internal
 */
export class FirstOrDefaultOperator<TSource> extends TyneqTerminalOperator<TSource, TSource> {
    private readonly predicate: ItemPredicate<TSource>;
    private readonly defaultValue: TSource;


    public constructor(source: TyneqSequence<TSource>, predicate: ItemPredicate<TSource>, defaultValue: TSource) {
        super(source);
        ArgumentUtility.checkNotOptional({ predicate });

        this.predicate = predicate;
        this.defaultValue = defaultValue;
    }

    public process(): TSource {
        let index = 0;
        for (const element of this.source) {
            if (this.predicate(element, index++)) {
                return element;
            }
        }

        return this.defaultValue;
    }
}