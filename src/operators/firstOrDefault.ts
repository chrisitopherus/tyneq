import { TyneqTerminalOperator } from "../core/TyneqTerminalOperator";
import { TyneqSequence } from "../types/core";
import { ArgumentUtility } from "../utility/argumentUtility";
import { nameof } from "../utility/nameof";

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
    private readonly predicate: (item: TSource) => boolean;
    private readonly defaultValue: TSource;

    
    public constructor(source: TyneqSequence<TSource>, predicate: (item: TSource) => boolean, defaultValue: TSource) {
        super(source);
        ArgumentUtility.checkNotOptional({ predicate });

        this.predicate = predicate;
        this.defaultValue = defaultValue;
    }

    public process(): TSource {
        for (const element of this.source) {
            if (this.predicate(element)) {
                return element;
            }
        }

        return this.defaultValue;
    }
}