import { builtinOperator } from "../../extensions/builtinOperator";
import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";

/**
 * Enumerator that bypasses elements from the beginning while a predicate is true, then yields all remaining elements.
 *
 * @remarks
 * Deferred. Source is not enumerated until iteration begins.
 *
 * Tests each element against the predicate until the first element that returns `false`.
 * That element and all subsequent elements are yielded without further predicate evaluation.
 * Once skipping ends it does not resume, even if later elements would satisfy the predicate.
 *
 * @group Enumerators
 * @internal
 */
@builtinOperator({ name: "skipWhile", kind: "streaming" })
export class SkipWhileEnumerator<T> extends TyneqEnumerator<T> {
    private readonly predicate: (item: T) => boolean;
    private isSkipping = true;

    /**
     * @param sourceEnumerator - The upstream enumerator to wrap.
     * @param predicate - Elements are skipped while this returns `true`.
     */
    public constructor(sourceEnumerator: Enumerator<T>, predicate: (item: T) => boolean) {
        super(sourceEnumerator);
        this.predicate = predicate;
    }

    protected override handleNext(): IteratorResult<T> {
        while (true) {
            const next = this.sourceEnumerator.next();
            if (next.done) {
                return this.done();
            }

            this.isSkipping = this.isSkipping && this.predicate(next.value);
            if (!this.isSkipping) {
                return this.yield(next.value);
            }
        }
    }
}