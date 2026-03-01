import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { IEnumerable } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

/**
 * Terminal operator implementation for checking if all elements satisfy a predicate.
 * 
 * @remarks
 * This is a terminal operator that returns true if all elements in the sequence satisfy
 * the predicate, or false otherwise. Short-circuits on the first element that fails the
 * predicate. Returns true for empty sequences.
 * 
 * **Performance**: O(1) space. O(n) worst-case time, O(1) best-case (early termination).
 * 
 * **Operator Category**: Terminal - forces evaluation and returns a boolean.
 * 
 * @typeParam T - The type of elements in the sequence.
 * 
 * @see {@link ITyneqEnumerable.all} for the public API.
 */
export class AllOperator<T> extends TyneqTerminalOperator<T, boolean> {
    /** Predicate function to test all elements. */
    private readonly predicate: (item: T) => boolean;

    /**
     * Creates a new all operator.
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
            if (!this.predicate(item)) {
                return false;
            }
        }

        return true;
    }
}