import { builtinOperator } from "../../extensibility/builtinOperator";
import { TyneqSourceEnumerator } from "../../core/enumerators/TyneqSourceEnumerator";
import { IEnumerator } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";

/**
 * Enumerator that projects each element through a selector function.
 *
 * @remarks
 * Deferred. Source is not enumerated until iteration begins.
 *
 * Applies the selector to each source element in order, yielding the transformed value.
 *
 * @group Enumerators
 * @internal
 */
@builtinOperator({ name: "select", kind: "streaming" })
export class SelectEnumerator<T, U> extends TyneqSourceEnumerator<T, U> {
    private readonly selector: (item: T) => U;

    /**
     * @param sourceEnumerator - The upstream enumerator to wrap.
     * @param selector - Transforms each source element into the output type.
     */
    public constructor(sourceEnumerator: IEnumerator<T>, selector: (item: T) => U) {
        super(sourceEnumerator);
        this.selector = selector;
    }

    protected override handleNext(): IteratorResult<U> {
        const next = this.sourceEnumerator.next();
        if (next.done) {
            return this.done();
        }

        const value = next.value;
        return this.yield(this.selector(value));
    }
}