import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { terminal } from "../../extensibility/operatorDecorators";
import { TyneqComparer } from "../../core/TyneqComparer";
import { IEnumerable, ITyneqEnumerable } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

/**
 * Terminal operator that returns `true` if two sequences contain equal elements in the same order.
 *
 * @remarks
 * This method uses immediate execution. The source sequence is fully enumerated when this method is called.
 *
 * Enumerates both sequences in parallel using `equalityComparer`. Short-circuits on the
 * first mismatch or length difference.
 *
 * @typeParam TSource - The type of elements in both sequences.
 *
 * @see {@link ITyneqEnumerable.sequenceEqual} for the public API.
 *
 * @group Operators
 * @category Terminal
 * @internal
 */
@terminal('sequenceEqual')
export class SequenceEqualOperator<TSource> extends TyneqTerminalOperator<TSource, boolean> {
    private readonly other: Iterable<TSource>;
    private readonly equalityComparer: (a: TSource, b: TSource) => boolean;

    /**
     * @param source - The source sequence.
     * @param other - The sequence to compare against.
     * @param equalityComparer - The comparer used to test element equality; defaults to strict equality.
     * @throws {ArgumentError} If `other` is null or undefined.
     */
    public constructor(source: ITyneqEnumerable<TSource>, other: Iterable<TSource>, equalityComparer?: (a: TSource, b: TSource) => boolean) {
        super(source);
        ArgumentUtility.checkNotOptional({ other });
        ArgumentUtility.checkNotNull({ equalityComparer });

        this.equalityComparer = equalityComparer ?? TyneqComparer.defaultEqualityComparer;
        this.other = other;
    }

    public process(): boolean {
        const sourceIterator = this.source[Symbol.iterator]();
        const otherIterator = this.other[Symbol.iterator]();

        while (true) {
            const sourceNext = sourceIterator.next();
            const otherNext = otherIterator.next();

            if (sourceNext.done && otherNext.done) {
                break;
            }

            if (sourceNext.done !== otherNext.done) {
                return false;
            }

            if (!this.equalityComparer(sourceNext.value, otherNext.value)) {
                return false;
            }
        }

        return true;
    }
}
