import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { terminal } from "../../extensibility/operatorDecorators";
import { IEnumerable } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

/**
 * Terminal operator implementation for checking if any element satisfies a predicate.
 * 
 * @remarks
 * This is a terminal operator that returns true if at least one element in the sequence
 * satisfies the predicate, or false otherwise. Short-circuits on the first matching element.
 * Returns false for empty sequences.
 * 
 * **Performance**: O(1) space. O(n) worst-case time, O(1) best-case (early termination).
 * 
 * **Operator Category**: Terminal - forces evaluation and returns a boolean.
 *
 * **Registration method**: TC39 `@terminal()` class decorator.
 *
 * This method uses immediate execution. The source sequence is fully enumerated when this method is called.
 *
 * @typeParam T - The type of elements in the sequence.
 *
 * @see {@link ITyneqEnumerable.any} for the public API.
 *
 * @group Operators
 * @category Terminal
 * @internal
 */
@terminal('any')
export class AnyOperator<T> extends TyneqTerminalOperator<T, boolean> {
    /** Predicate function to test elements. */
    private readonly predicate: (item: T) => boolean;

    /**
     * Creates a new any operator.
     * 
     * @param source - The source sequence.
     * @param predicate - Function to test each element.
     * @throws {ArgumentError} If predicate is null or undefined.
     */
    public constructor(source: IEnumerable<T>, predicate: (item: T) => boolean) {
        super(source);
        ArgumentUtility.checkNotOptional({ predicate });

        this.predicate = predicate;
    }

    public process(): boolean {
        for (const item of this.source) {
            if (this.predicate(item)) {
                return true;
            }
        }

        return false;
    }

}