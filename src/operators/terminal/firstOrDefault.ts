import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { terminal } from "../../extensibility/operatorDecorators";
import { ITyneqEnumerable } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

/**
 * Terminal operator that returns the first element satisfying a predicate, or a default value if none is found.
 *
 * @remarks
 * This method uses immediate execution. The source sequence is fully enumerated when this method is called.
 *
 * Short-circuits on the first matching element. Returns `defaultValue` rather than throwing
 * when no element satisfies the predicate.
 *
 * @typeParam TSource - The type of elements in the sequence.
 *
 * @see {@link ITyneqEnumerable.firstOrDefault} for the public API.
 *
 * @group Operators
 * @category Terminal
 * @internal
 */
@terminal('firstOrDefault')
export class FirstOrDefaultOperator<TSource> extends TyneqTerminalOperator<TSource, TSource> {
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
        for (const element of this.source) {
            if (this.predicate(element)) {
                return element;
            }
        }

        return this.defaultValue;
    }
}
