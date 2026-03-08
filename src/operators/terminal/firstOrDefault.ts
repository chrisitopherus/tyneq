import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { terminal } from "../../extensibility/operatorDecorators";
import { ITyneqEnumerable } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

/**
 * Terminal operator implementation for retrieving the first element matching a predicate with a default.
 * 
 * @remarks
 * This is a terminal operator that returns the first element that satisfies the predicate,
 * or a default value if no matching element is found. Short-circuits on the first match.
 * Does not throw exceptions.
 * 
 * **Performance**: O(1) space. O(n) worst-case time, O(1) best-case (early termination).
 * 
 * **Operator Category**: Terminal - forces partial evaluation and returns an element.
 *
 * **Registration method**: TC39 `@terminal()` class decorator.
 *
 * This method uses immediate execution. The source sequence is fully enumerated when this method is called.
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
    /** Predicate function to identify the desired element. */
    private readonly predicate: (item: TSource) => boolean;
    /** The value to return if no matching element is found. */
    private readonly defaultValue: TSource;

    /**
     * Creates a new firstOrDefault operator.
     * 
     * @param source - The source sequence.
     * @param predicate - Function to test each element.
     * @param defaultValue - The value to return if no match is found.
     * @throws {ArgumentError} If predicate is null or undefined.
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