import { InvalidOperationError } from "../../core/errors/InvalidOperationError";
import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { terminal } from "../../extensibility/terminal";
import { ITyneqEnumerable } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

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
 * @see {@link ITyneqEnumerable.first} for the public API.
 *
 * @group Operators
 * @category Terminal
 * @internal
 */
@terminal<[(item: unknown) => boolean]>("first", (predicate) => {
    ArgumentUtility.checkNotOptional({ predicate });
})
export class FirstOperator<TSource> extends TyneqTerminalOperator<TSource, TSource> {
    private readonly predicate: (item: TSource) => boolean;

    /**
     * @param source - The source sequence.
     * @param predicate - The predicate tested against each element.
     */
    public constructor(source: ITyneqEnumerable<TSource>, predicate: (item: TSource) => boolean) {
        super(source);
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
