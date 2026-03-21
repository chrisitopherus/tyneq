import { TyneqEnumeratorCore } from "../enumerators/TyneqEnumeratorCore";
import { ArgumentOutOfRangeError } from "../errors/argument/ArgumentOutOfRangeError";
import { nameof } from "../../utility/nameof";

/**
 * Enumerator that generates a sequence of consecutive integers from `start` to `end` inclusive.
 *
 * @remarks
 * Deferred. Values are generated on demand.
 *
 * Each call to `next()` yields the next integer in the range without buffering.
 *
 * @group Enumerators
 * @internal
 */
export class RangeEnumerator extends TyneqEnumeratorCore<number> {
    private current: number;
    private end: number;

    /**
     * @param start - First integer in the range (inclusive).
     * @param end - Last integer in the range (inclusive); must be >= `start`.
     * @throws {ArgumentOutOfRangeError} If `start` is greater than `end`.
     */
    public constructor(start: number, end: number) {
        super();
        const [startName] = nameof({ start });
        const [endName] = nameof({ end });
        if (start > end) {
            throw new ArgumentOutOfRangeError(startName, `Expected ${startName} to be less than or equal to ${endName}.`);
        }

        this.current = start;
        this.end = end;
    }

    protected override handleNext(): IteratorResult<number> {
        if (this.current > this.end) {
            return this.done();
        }

        return this.yield(this.current++);
    }
}
