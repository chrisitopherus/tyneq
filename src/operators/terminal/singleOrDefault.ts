import { InvalidOperationError } from "../../core/errors/InvalidOperationError";
import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { ITyneqEnumerable } from "../../types/core";
import { Nullable } from "../../types/utility";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

/**
 * Terminal operator implementation for retrieving the single element matching a predicate with a default.
 * 
 * @remarks
 * This is a terminal operator that returns the only element that satisfies the predicate,
 * or a default value if no elements match. Throws an error if more than one element matches.
 * Must enumerate all elements to ensure uniqueness.
 * 
 * **Performance**: O(1) space. O(n) time (must enumerate all elements to verify uniqueness).
 * 
 * **Operator Category**: Terminal - forces full evaluation and returns an element.
 *
 * This method uses immediate execution. The source sequence is fully enumerated when this method is called.
 *
 * @typeParam TSource - The type of elements in the sequence.
 *
 * @see {@link ITyneqEnumerable.singleOrDefault} for the public API.
 *
 * @group Operators
 * @category Terminal
 * @internal
 */
export class SingleOrDefaultOperator<TSource> extends TyneqTerminalOperator<TSource, TSource> {
    /** Predicate function to identify the desired element. */
    private readonly predicate: (item: TSource) => boolean;
    /** The value to return if no matching element is found. */
    private readonly defaultValue: TSource;

    /**
     * Creates a new singleOrDefault operator.
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