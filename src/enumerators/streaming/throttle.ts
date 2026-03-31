import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";

/**
 * Yields every nth element from the source sequence.
 *
 * @remarks
 * Deferred. Source is not enumerated until the returned sequence is iterated.
 *
 * @see {@link TyneqSequence.throttle}
 * @group Operators
 * @category Streaming
 * @internal
 */
export class ThrottleEnumerator<T> extends TyneqEnumerator<T> {
    private readonly count: number;
    private index: number = -1;

    
    public constructor(sourceEnumerator: Enumerator<T>, count: number) {
        super(sourceEnumerator);
        this.count = count;
    }

    protected override handleNext(): IteratorResult<T> {
        while (true) {
            const { value, done } = this.sourceEnumerator.next();
            if (done) {
                return this.done();
            }

            this.index++;
            if (this.index % this.count === 0) {
                return this.yield(value);
            }
        }
    }
}