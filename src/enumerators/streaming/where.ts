import { builtinOperator } from "../../extensions/builtinOperator";
import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";

/**
 * Enumerator that filters elements based on a predicate.
 *
 * @remarks
 * Deferred. Source is not enumerated until iteration begins.
 *
 * Yields only those elements for which the predicate returns `true`. The predicate is evaluated
 * for every element in the source sequence.
 *
 * @group Enumerators
 * @internal
 */
@builtinOperator({ name: "where", kind: "streaming" })
export class WhereEnumerator<T> extends TyneqEnumerator<T> {
    private readonly predicate: (item: T) => boolean;

    /**
     * @param sourceEnumerator - The upstream enumerator to wrap.
     * @param predicate - Determines which elements to yield; only elements returning `true` are included.
     */
    public constructor(sourceEnumerator: Enumerator<T>, predicate: (item: T) => boolean) {
        super(sourceEnumerator);
        this.predicate = predicate;
    }

    protected override handleNext(): IteratorResult<T> {
        while (true) {
            const { value, done } = this.sourceEnumerator.next();
            if (done) {
                return this.done();
            }

            if (this.predicate(value)) {
                return this.yield(value);
            }
        }
    }
}