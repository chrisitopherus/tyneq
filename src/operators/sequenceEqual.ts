import { TyneqTerminalOperator } from "../core/terminal/TyneqTerminalOperator";
import { TyneqComparer } from "../core/TyneqComparer";
import { TyneqSequence, EqualityComparer } from "../types/core";
import { ArgumentUtility } from "../utility/ArgumentUtility";

/**
 * Returns true if the source and a second sequence contain equal elements in the same order.
 *
 * @remarks
 * Immediate. Source is fully enumerated when this method is called.
 *
 * @see {@link TyneqSequence.sequenceEqual}
 * @group Operators
 * @category Terminal
 * @internal
 */
export class SequenceEqualOperator<TSource> extends TyneqTerminalOperator<TSource, boolean> {
    private readonly other: Iterable<TSource>;
    private readonly equalityComparer: EqualityComparer<TSource>;

    public constructor(source: TyneqSequence<TSource>, other: Iterable<TSource>, equalityComparer?: EqualityComparer<TSource>) {
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