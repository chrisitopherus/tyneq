import { TyneqTerminalOperator } from "../core/terminal/TyneqTerminalOperator";
import { TyneqComparer } from "../core/TyneqComparer";
import { Enumerable, EqualityComparer } from "../types/core";
import { Nullable } from "../types/utility";
import { ArgumentUtility } from "../utility/ArgumentUtility";

/**
 * Returns `true` if the source sequence ends with all elements of `sequence` in order.
 *
 * @remarks
 * Immediate. Source is fully enumerated when this method is called.
 * Uses `equalityComparer` for element comparison, or `===` when omitted.
 * Returns `true` when `sequence` is empty (vacuous truth).
 * Returns `false` when `sequence` is longer than the source.
 *
 * @see {@link TyneqSequence.endsWith}
 * @group Operators
 * @category Terminal
 * @internal
 */
type CircularBufferResult<T> = { buffer: T[], readIndex: number };

export class EndsWithOperator<T> extends TyneqTerminalOperator<T, boolean> {
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
        const suffixElements = Array.from(this.sequence);

        if (suffixElements.length === 0) {
            return true;
        }

        const bufferResult = this.fillCircularBuffer(this.source, suffixElements.length);

        if (bufferResult === null) {
            return false;
        }

        const { buffer, readIndex } = bufferResult;

        for (let i = 0; i < suffixElements.length; i++) {
            if (!this.equalityComparer(buffer[(readIndex + i) % buffer.length], suffixElements[i])) {
                return false;
            }
        }

        return true;
    }

    private fillCircularBuffer(elements: Iterable<T>, windowSize: number): Nullable<CircularBufferResult<T>> {
        const buffer: T[] = new Array(windowSize);
        let writeIndex = 0;

        for (const item of elements) {
            buffer[writeIndex % windowSize] = item;
            writeIndex++;
        }

        // Source shorter than the requested window -- suffix cannot match
        if (writeIndex < windowSize) {
            return null;
        }

        return { buffer, readIndex: writeIndex % windowSize };
    }
}