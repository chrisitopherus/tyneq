import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { IEnumerable } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

/**
 * Terminal operator implementation for checking if a sequence starts with another sequence.
 * 
 * @remarks
 * This is a terminal operator that determines whether the source sequence begins with all
 * elements from another sequence in the same order. Uses strict equality (===) for comparison.
 * Short-circuits as soon as the prefix is fully matched or a mismatch is found.
 * 
 * **Performance**: O(1) space. O(k) time where k is the length of the prefix sequence
 * (short-circuits on mismatch).
 * 
 * **Operator Category**: Terminal - forces partial evaluation and returns a boolean.
 * 
 * @typeParam T - The type of elements in both sequences.
 * 
 * @see {@link ITyneqEnumerable.startsWith} for the public API.
 */
export class StartsWithOperator<T> extends TyneqTerminalOperator<T, boolean> {
    /** The prefix sequence to check for. */
    private readonly sequence: IEnumerable<T>;

    /**
     * Creates a new startsWith operator.
     * 
     * @param source - The source sequence.
     * @param sequence - The prefix sequence to check for.
     * @throws {ArgumentError} If sequence is null or undefined.
     */
    public constructor(source: IEnumerable<T>, sequence: IEnumerable<T>) {
        super(source);
        ArgumentUtility.checkNotOptional(sequence, nameof({ sequence }));

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