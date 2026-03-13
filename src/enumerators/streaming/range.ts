import { TyneqBaseEnumerator } from "../../core/enumerators/TyneqBaseEnumerator";
import { ArgumentOutOfRangeError } from "../../core/errors/argument/ArgumentOutOfRangeError";
import { nameof } from "../../utility/nameof";

/**
 * Enumerator that generates a sequence of consecutive integers from `start` to `end` inclusive.
 *
 * @remarks
 * This method uses deferred execution. The source sequence is not enumerated until the returned sequence is iterated.
 *
 * Each call to `next()` yields the next integer in the range without buffering.
 *
 * @group Enumerators
 * @internal
 */
export class RangeEnumerator extends TyneqBaseEnumerator<number> {
    private current: number;
    private end: number;

    /**
     * @param start - First integer in the range (inclusive).
     * @param end - Last integer in the range (inclusive); must be >= `start`.
     * @throws {ArgumentOutOfRangeError} If `start` is greater than `end`.
     */
    public constructor(start: number, end: number) {
        super();
        if (start > end) {
            throw new ArgumentOutOfRangeError(nameof({ start })[0], `Expected ${nameof({ start })[0]} to be less than or equal to ${nameof({ end })[0]}.`);
        }

        this.current = start;
        this.end = end;
    }

    protected override dispose(value?: unknown): void {
        this.disposeSource();
        this.disposeAdditional(value);
    }

    protected override disposeSource(): void {
        if (this.sourceDisposed) return;
        this.sourceDisposed = true;
    }

    protected override handleNext(): IteratorResult<number> {
        if (this.current > this.end) {
            return this.done();
        }

        return this.yield(this.current++);
    }
}
