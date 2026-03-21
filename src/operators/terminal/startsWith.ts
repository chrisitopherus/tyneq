import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { terminal } from "../../extensibility/terminal";
import { IEnumerable } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

/**
 * Terminal operator that returns `true` if the source sequence begins with all elements of a prefix sequence.
 *
 * @remarks
 * This method uses immediate execution. The source sequence is fully enumerated when this method is called.
 *
 * Compares corresponding elements using strict equality (`===`). Short-circuits as soon as
 * the prefix is fully matched or a mismatch is found.
 *
 * @typeParam T - The type of elements in both sequences.
 *
 * @see {@link ITyneqEnumerable.startsWith} for the public API.
 *
 * @group Operators
 * @category Terminal
 * @internal
 */
@terminal("startsWith")
export class StartsWithOperator<T> extends TyneqTerminalOperator<T, boolean> {
    private readonly sequence: Iterable<T>;

    /**
     * @param source - The source sequence.
     * @param sequence - The prefix sequence to check for.
     * @throws {ArgumentError} If `sequence` is null, undefined, or not iterable.
     */
    public constructor(source: IEnumerable<T>, sequence: Iterable<T>) {
        super(source);
        ArgumentUtility.checkNotOptional({ sequence });
        ArgumentUtility.checkIterable({ sequence });

        this.sequence = sequence;
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

            if (sourceDone || sourceValue !== sequenceValue) {
                return false;
            }
        }
    }
}
