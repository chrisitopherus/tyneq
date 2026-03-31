import { TyneqTerminalOperator } from "../core/TyneqTerminalOperator";
import { Enumerable } from "../types/core";
import { ArgumentUtility } from "../utility/argumentUtility";
import { nameof } from "../utility/nameof";

/**
 * Returns true if the source sequence begins with all elements of a second sequence.
 *
 * @remarks
 * Immediate. Source is fully enumerated when this method is called.
 *
 * @see {@link TyneqSequence.startsWith}
 * @group Operators
 * @category Terminal
 * @internal
 */
export class StartsWithOperator<T> extends TyneqTerminalOperator<T, boolean> {
    private readonly sequence: Iterable<T>;

    
    public constructor(source: Enumerable<T>, sequence: Iterable<T>) {
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