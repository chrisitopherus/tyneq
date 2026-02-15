import { InvalidOperationError } from "../../core/errors/InvalidOperationError";
import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { ITyneqEnumerable } from "../../types/core";
import { Nullable } from "../../types/utility";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

/**
 * Terminal operator implementation for retrieving the single element matching a predicate.
 * 
 * @remarks
 * This is a terminal operator that returns the only element that satisfies the predicate.
 * Throws an error if no elements match or if more than one element matches. Must enumerate
 * all elements to ensure uniqueness.
 * 
 * **Performance**: O(1) space. O(n) time (must enumerate all elements to verify uniqueness).
 * 
 * **Operator Category**: Terminal - forces full evaluation and returns an element.
 * 
 * @typeParam TSource - The type of elements in the sequence.
 * 
 * @see {@link ITyneqEnumerable.single} for the public API.
 */
export class SingleOperator<TSource> extends TyneqTerminalOperator<TSource, TSource> {
    /** Predicate function to identify the desired element. */
    private readonly predicate: (item: TSource) => boolean;

    /**
     * Creates a new single operator.
     * 
     * @param source - The source sequence.
     * @param predicate - Function to test each element.
     * @throws {ArgumentError} If predicate is null or undefined.
     */
    public constructor(source: ITyneqEnumerable<TSource>, predicate: (item: TSource) => boolean) {
        super(source);
        ArgumentUtility.checkNotOptional(predicate, nameof({ predicate }));

        this.predicate = predicate;
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
            throw new InvalidOperationError("Sequence contains no matching element");
        }

        return single as TSource;
    }
}