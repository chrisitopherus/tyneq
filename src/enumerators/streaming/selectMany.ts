import { builtinOperator } from "../../extensions/builtinOperator";
import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";
import { Nullable } from "../../types/utility";
import { ArgumentUtility } from "../../utility/argumentUtility";

/**
 * Enumerator that projects each element to a nested sequence and flattens the results.
 *
 * @remarks
 * Deferred. Source is not enumerated until iteration begins.
 *
 * Applies the selector to each source element to obtain a nested sequence, then yields all
 * elements of each nested sequence in order (flatMap semantics).
 *
 * @group Enumerators
 * @internal
 */
@builtinOperator({ name: "selectMany", kind: "streaming" })
export class SelectManyEnumerator<T, U> extends TyneqEnumerator<T, U> {
    private readonly selector: (item: T) => Iterable<U>;
    private innerEnumerator: Nullable<Enumerator<U>> = null;

    /**
     * @param sourceEnumerator - The upstream enumerator to wrap.
     * @param selector - Maps each source element to a nested sequence to flatten.
     */
    public constructor(sourceEnumerator: Enumerator<T>, selector: (item: T) => Iterable<U>) {
        super(sourceEnumerator);
        this.selector = selector;
    }

    protected override handleNext(): IteratorResult<U> {
        while (true) {
            if (this.innerEnumerator !== null) {
                const innerNext = this.innerEnumerator.next();
                if (!innerNext.done) {
                    return this.yield(innerNext.value);
                }

                this.innerEnumerator = null;
            }

            const sourceNext = this.sourceEnumerator.next();
            if (sourceNext.done) {
                return this.done();
            }

            this.innerEnumerator = this.selector(sourceNext.value)[Symbol.iterator]();
        }
    }
}