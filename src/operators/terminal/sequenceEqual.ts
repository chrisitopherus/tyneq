import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { TyneqComparer } from "../../core/TyneqComparer";
import { IEnumerable, ITyneqEnumerable } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

/**
 * Terminal operator implementation for comparing two sequences for equality.
 * 
 * @remarks
 * This is a terminal operator that determines whether two sequences contain equal elements
 * in the same order using an equality comparer. Enumerates both sequences in parallel and
 * verifies they have the same length and corresponding elements are equal.
 * 
 * **Performance**: O(1) space. O(min(n, m)) time where n and m are sequence lengths
 * (short-circuits on first mismatch).
 * 
 * **Operator Category**: Terminal - forces evaluation and returns a boolean.
 *
 * This method uses immediate execution. The source sequence is fully enumerated when this method is called.
 *
 * @typeParam TSource - The type of elements in both sequences.
 *
 * @see {@link ITyneqEnumerable.sequenceEqual} for the public API.
 *
 * @group Operators
 * @category Terminal
 * @internal
 */
export class SequenceEqualOperator<TSource> extends TyneqTerminalOperator<TSource, boolean> {
    /** The sequence to compare against. */
    private readonly other: Iterable<TSource>;
    /** Function to compare elements for equality. */
    private readonly equalityComparer: (a: TSource, b: TSource) => boolean;

    /**
     * Creates a new sequenceEqual operator.
     * 
     * @param source - The first sequence.
     * @param other - The sequence to compare against.
     * @param equalityComparer - Optional function to compare elements for equality.
     * @throws {ArgumentError} If other is null or undefined.
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