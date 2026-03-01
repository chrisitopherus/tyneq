import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { IEnumerable } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

/**
 * Terminal operator implementation for finding the index of the first matching element.
 * 
 * @remarks
 * This is a terminal operator that returns the zero-based index of the first element
 * that satisfies the predicate, starting from a specified index. Returns -1 if no match
 * is found. Short-circuits on the first match.
 * 
 * **Performance**: O(1) space. O(n) worst-case time, O(1) best-case (early termination).
 * 
 * **Operator Category**: Terminal - forces partial evaluation and returns a number.
 * 
 * @typeParam T - The type of elements in the sequence.
 * 
 * @see {@link ITyneqEnumerable.indexOf} for the public API.
 */
export class IndexOfOperator<T> extends TyneqTerminalOperator<T, number> {
    /** Predicate function to identify the desired element. */
    private readonly predicate: (item: T) => boolean;
    /** The zero-based index to start searching from. */
    private readonly startIndex: number;

    /**
     * Creates a new indexOf operator.
     * 
     * @param source - The source sequence.
     * @param predicate - Function to test each element.
     * @param startIndex - The index to start searching from (default: 0).
     * @throws {ArgumentError} If predicate is null/undefined or startIndex is negative.
     */
    public constructor(source: IEnumerable<T>, predicate: (item: T) => boolean, startIndex: number = 0) {
        super(source);
        ArgumentUtility.checkNotOptional({ predicate });
        ArgumentUtility.checkNonNegative({ startIndex });

        this.predicate = predicate;
        this.startIndex = startIndex;
    }

    public process(): number {
        let index = -1;
        for (const item of this.source) {
            index++;
            if (index < this.startIndex) {
                continue;
            }

            if (this.predicate(item)) {
                return index;
            }
        }

        return -1;
    }

}