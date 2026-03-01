import { InvalidOperationError } from "../../core/errors/InvalidOperationError";
import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { ITyneqEnumerable } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

/**
 * Terminal operator implementation for retrieving the first element matching a predicate.
 * 
 * @remarks
 * This is a terminal operator that returns the first element that satisfies the predicate.
 * Throws an error if no matching element is found. Short-circuits on the first match.
 * 
 * **Performance**: O(1) space. O(n) worst-case time, O(1) best-case (early termination).
 * 
 * **Operator Category**: Terminal - forces partial evaluation and returns an element.
 * 
 * @typeParam TSource - The type of elements in the sequence.
 * 
 * @see {@link ITyneqEnumerable.first} for the public API.
 */
export class FirstOperator<TSource> extends TyneqTerminalOperator<TSource, TSource> {
    /** Predicate function to identify the desired element. */
    private readonly predicate: (item: TSource) => boolean;

    /**
     * Creates a new first operator.
     * 
     * @param source - The source sequence.
     * @param predicate - Function to test each element.
     * @throws {ArgumentError} If predicate is null or undefined.
     */
    public constructor(source: ITyneqEnumerable<TSource>, predicate: (item: TSource) => boolean) {
        super(source);
        ArgumentUtility.checkNotOptional({ predicate });

        this.predicate = predicate;
    }

    public process(): TSource {
        for (const element of this.source) {
            if (this.predicate(element)) {
                return element;
            }
        }

        throw new InvalidOperationError("Sequence contains no matching element");
    }
}