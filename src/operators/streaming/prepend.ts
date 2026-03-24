import { builtinOperator } from "../../extensibility/builtinOperator";
import { TyneqSourceEnumerator } from "../../core/enumerators/TyneqSourceEnumerator";
import { IEnumerator } from "../../types/core";

/**
 * Enumerator that prepends a single element to the beginning of a sequence.
 *
 * @remarks
 * Deferred. Source is not enumerated until iteration begins.
 *
 * Yields the prepended item first, then all source elements.
 *
 * @group Enumerators
 * @internal
 */
@builtinOperator({ name: "prepend", kind: "streaming" })
export class PrependEnumerator<T> extends TyneqSourceEnumerator<T> {
    private prepended = false;
    private readonly item: T;

    /**
     * @param sourceEnumerator - The upstream enumerator to wrap.
     * @param item - The element to yield before all source elements.
     */
    public constructor(sourceEnumerator: IEnumerator<T>, item: T) {
        super(sourceEnumerator);
        this.item = item;
    }

    protected override handleNext(): IteratorResult<T> {
        if (!this.prepended) {
            this.prepended = true;
            return this.yield(this.item);
        }

        const nextItem = this.sourceEnumerator.next();
        if (!nextItem.done) {
            return this.yield(nextItem.value);
        }

        return this.done();
    }
}