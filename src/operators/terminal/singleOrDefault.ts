import { InvalidOperationError } from "../../core/errors/InvalidOperationError";
import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { terminal } from "../../extensibility/operatorDecorators";
import { ITyneqEnumerable } from "../../types/core";
import { Nullable } from "../../types/utility";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

/**
 * Terminal operator that returns the single element satisfying a predicate, or a default value if none is found.
 *
 * @remarks
 * This method uses immediate execution. The source sequence is fully enumerated when this method is called.
 *
 * Must enumerate the entire sequence to ensure uniqueness. Returns `defaultValue` when no
 * element matches. Throws if more than one element matches.
 *
 * @typeParam TSource - The type of elements in the sequence.
 *
 * @see {@link ITyneqEnumerable.singleOrDefault} for the public API.
 *
 * @group Operators
 * @category Terminal
 * @internal
 */
@terminal('singleOrDefault')
export class SingleOrDefaultOperator<TSource> extends TyneqTerminalOperator<TSource, TSource> {
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
            return this.defaultValue;
        }

        return single as TSource;
    }
}
