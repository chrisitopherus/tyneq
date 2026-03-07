import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { ITyneqEnumerable } from "../../types/core";
import { Nullable } from "../../types/utility";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

/**
 * Terminal operator implementation for retrieving the last element matching a predicate with a default.
 * 
 * @remarks
 * This is a terminal operator that returns the last element that satisfies the predicate,
 * or a default value if no matching element is found. Must enumerate the entire sequence
 * to find the last match. Does not throw exceptions.
 * 
 * **Performance**: O(1) space. O(n) time (must enumerate all elements).
 * 
 * **Operator Category**: Terminal - forces full evaluation and returns an element.
 *
 * This method uses immediate execution. The source sequence is fully enumerated when this method is called.
 *
 * @typeParam TSource - The type of elements in the sequence.
 *
 * @see {@link ITyneqEnumerable.lastOrDefault} for the public API.
 *
 * @group Operators
 * @category Terminal
 * @internal
 */
export class LastOrDefaultOperator<TSource> extends TyneqTerminalOperator<TSource, TSource> {
    /** Predicate function to identify the desired element. */
    private readonly predicate: (item: TSource) => boolean;
    /** The value to return if no matching element is found. */
    private readonly defaultValue: TSource;

    /**
     * Creates a new lastOrDefault operator.
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