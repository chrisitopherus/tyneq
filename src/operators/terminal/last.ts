import { builtinTerminal } from "../../extensibility/builtinTerminal";
import { InvalidOperationError } from "../../core/errors/InvalidOperationError";
import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { ITyneqEnumerable } from "../../types/core";
import { Nullable } from "../../types/utility";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

/**
 * Terminal operator that returns the last element satisfying a predicate.
 *
 * @remarks
 * This method uses immediate execution. The source sequence is fully enumerated when this method is called.
 *
 * Must enumerate the entire sequence to find the last match. Throws if no element satisfies
 * the predicate.
 *
 * @typeParam TSource - The type of elements in the sequence.
 *
 * @see {@link ITyneqEnumerable.last} for the public API.
 *
 * @group Operators
 * @category Terminal
 * @internal
 */
@builtinTerminal({ name: "last" })
export class LastOperator<TSource> extends TyneqTerminalOperator<TSource, TSource> {
    private readonly predicate: (item: TSource) => boolean;

    /**
     * @param source - The source sequence.
     * @param predicate - The predicate tested against each element.
     * @throws {ArgumentError} If `predicate` is null or undefined.
     */
    public constructor(source: ITyneqEnumerable<TSource>, predicate: (item: TSource) => boolean) {
        super(source);
        ArgumentUtility.checkNotOptional({ predicate });

        this.predicate = predicate;
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
            throw new InvalidOperationError("Sequence contains no matching element");
        }

        return lastMatchingElement as TSource;
    }
}