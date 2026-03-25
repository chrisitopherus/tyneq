import { builtinTerminal } from "../extensions/builtinTerminal";
import { InvalidOperationError } from "../core/errors/InvalidOperationError";
import { TyneqTerminalOperator } from "../core/TyneqTerminalOperator";
import { TyneqSequence } from "../types/core";
import { ArgumentUtility } from "../utility/argumentUtility";
import { nameof } from "../utility/nameof";

/**
 * Terminal operator that returns the first element satisfying a predicate.
 *
 * @remarks
 * This method uses immediate execution. The source sequence is fully enumerated when this method is called.
 *
 * Short-circuits on the first matching element. Throws if no element satisfies the predicate.
 *
 * @typeParam TSource - The type of elements in the sequence.
 *
 * @see {@link TyneqSequence.first} for the public API.
 *
 * @group Operators
 * @category Terminal
 * @internal
 */
@builtinTerminal({ name: "first" })
export class FirstOperator<TSource> extends TyneqTerminalOperator<TSource, TSource> {
    private readonly predicate: (item: TSource) => boolean;

    /**
     * @param source - The source sequence.
     * @param predicate - The predicate tested against each element.
     */
    public constructor(source: TyneqSequence<TSource>, predicate: (item: TSource) => boolean) {
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