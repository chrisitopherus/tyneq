import { TyneqTerminalOperator } from "../core/terminal/TyneqTerminalOperator";
import { TyneqComparer } from "../core/TyneqComparer";
import { Enumerable, EqualityComparer } from "../types/core";
import { ArgumentUtility } from "../utility/ArgumentUtility";

/**
 * Returns `true` if the source sequence begins with all elements of `sequence` in order.
 *
 * @remarks
 * Immediate. Source is fully enumerated when this method is called.
 * Uses `equalityComparer` for element comparison, or `===` when omitted.
 * Returns `true` when `sequence` is empty (vacuous truth).
 * Returns `false` when `sequence` is longer than the source.
 *
 * @see {@link TyneqSequence.startsWith}
 * @group Operators
 * @category Terminal
 * @internal
 */
export class StartsWithOperator<T> extends TyneqTerminalOperator<T, boolean> {
    private readonly sequence: Iterable<T>;
    private readonly equalityComparer: EqualityComparer<T>;

    public constructor(source: Enumerable<T>, sequence: Iterable<T>, equalityComparer?: EqualityComparer<T>) {
        super(source);
        ArgumentUtility.checkNotOptional({ sequence });
        ArgumentUtility.checkIterable({ sequence });
        ArgumentUtility.checkNotNull({ equalityComparer });

        this.sequence = sequence;
        this.equalityComparer = equalityComparer ?? TyneqComparer.defaultEqualityComparer;
    }

    public process(): boolean {
        const sourceEnumerator = this.source[Symbol.iterator]();
        const sequenceEnumerator = this.sequence[Symbol.iterator]();

        while (true) {
            const { value: sourceValue, done: sourceDone } = sourceEnumerator.next();
            const { value: sequenceValue, done: sequenceDone } = sequenceEnumerator.next();

            if (sequenceDone) {
                return true;
            }

            if (sourceDone || !this.equalityComparer(sourceValue, sequenceValue)) {
                return false;
            }
        }
    }
}
