import { TyneqSourceEnumerator } from "../../core/enumerators/TyneqSourceEnumerator";
import { IEnumerator } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { operator } from "../../extensibility/operator";

/**
 * Enumerator that yields elements while a predicate is true, then stops.
 *
 * @remarks
 * Deferred. Source is not enumerated until iteration begins.
 *
 * Evaluates the predicate for each element. The first element that returns `false` causes early
 * completion; that element and all subsequent elements are not yielded.
 *
 * @group Enumerators
 * @internal
 */
@operator<[predicate: unknown]>("takeWhile", (predicate) => {
    ArgumentUtility.checkNotOptional({ predicate });
})
export class TakeWhileEnumerator<T> extends TyneqSourceEnumerator<T> {
    private readonly predicate: (value: T) => boolean;

    /**
     * @param sourceEnumerator - The upstream enumerator to wrap.
     * @param predicate - Elements are yielded while this returns `true`.
     */
    public constructor(sourceEnumerator: IEnumerator<T>, predicate: (value: T) => boolean) {
        super(sourceEnumerator);
        this.predicate = predicate;
    }

    protected override handleNext(): IteratorResult<T> {
        const result = this.sourceEnumerator.next();
        if (result.done) {
            return this.done();
        }

        if (this.predicate(result.value)) {
            return this.yield(result.value);
        }

        return this.earlyComplete();
    }
}
