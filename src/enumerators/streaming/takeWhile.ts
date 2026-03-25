import { builtinOperator } from "../../extensions/builtinOperator";
import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";

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
@builtinOperator({ name: "takeWhile", kind: "streaming" })
export class TakeWhileEnumerator<T> extends TyneqEnumerator<T> {
    private readonly predicate: (value: T) => boolean;

    /**
     * @param sourceEnumerator - The upstream enumerator to wrap.
     * @param predicate - Elements are yielded while this returns `true`.
     */
    public constructor(sourceEnumerator: Enumerator<T>, predicate: (value: T) => boolean) {
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