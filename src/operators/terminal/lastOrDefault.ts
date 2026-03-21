import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { terminal } from "../../extensibility/terminal";
import { ITyneqEnumerable } from "../../types/core";
import { Nullable } from "../../types/utility";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

/**
 * Terminal operator that returns the last element satisfying a predicate, or a default value if none is found.
 *
 * @remarks
 * This method uses immediate execution. The source sequence is fully enumerated when this method is called.
 *
 * Must enumerate the entire sequence to find the last match. Returns `defaultValue` rather
 * than throwing when no element satisfies the predicate.
 *
 * @typeParam TSource - The type of elements in the sequence.
 *
 * @see {@link ITyneqEnumerable.lastOrDefault} for the public API.
 *
 * @group Operators
 * @category Terminal
 * @internal
 */
@terminal("lastOrDefault")
export class LastOrDefaultOperator<TSource> extends TyneqTerminalOperator<TSource, TSource> {
    private readonly predicate: (item: TSource) => boolean;
    private readonly defaultValue: TSource;

    /**
     * @param source - The source sequence.
     * @param predicate - The predicate tested against each element.
     * @param defaultValue - The value returned when no element matches.
     * @throws {ArgumentError} If `predicate` is null or undefined.
     */
    public constructor(source: ITyneqEnumerable<TSource>, predicate: (item: TSource) => boolean, defaultValue: TSource) {
        super(source);
        ArgumentUtility.checkNotOptional({ predicate });

        this.predicate = predicate;
        this.defaultValue = defaultValue;
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
            return this.defaultValue;
        }

        return lastMatchingElement as TSource;
    }
}
