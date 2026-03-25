import { builtinOperator } from "../../extensibility/builtinOperator";
import { TyneqSourceEnumerator } from "../../core/enumerators/TyneqSourceEnumerator";
import { IEnumerator } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";

/**
 * Enumerator that yields every Nth element from a sequence.
 *
 * @remarks
 * Deferred. Source is not enumerated until iteration begins.
 *
 * The element at index 0 is always yielded; subsequent elements are yielded at indices that are
 * multiples of `count` (0, count, 2×count, …).
 *
 * @group Enumerators
 * @internal
 */
@builtinOperator({ name: "throttle", kind: "streaming" })
export class ThrottleEnumerator<T> extends TyneqSourceEnumerator<T> {
    private readonly count: number;
    private index: number = -1;

    /**
     * @param sourceEnumerator - The upstream enumerator to wrap.
     * @param count - Stride between yielded elements; must be a positive safe integer.
     */
    public constructor(sourceEnumerator: IEnumerator<T>, count: number) {
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