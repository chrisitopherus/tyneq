import { builtinOperator } from "../../extensibility/builtinOperator";
import { TyneqSourceEnumerator } from "../../core/enumerators/TyneqSourceEnumerator";
import { IEnumerator } from "../../types/core";

/**
 * Enumerator that appends a single element to the end of a sequence.
 *
 * @remarks
 * Deferred. Source is not enumerated until iteration begins.
 *
 * Yields all source elements first, then the appended item.
 *
 * @group Enumerators
 * @internal
 */
@builtinOperator({ name: "append", kind: "streaming" })
export class AppendEnumerator<T> extends TyneqSourceEnumerator<T> {
    private isSourceDone = false;
    private appended = false;
    private readonly item: T;

    /**
     * @param sourceEnumerator - The upstream enumerator to wrap.
     * @param item - The element to append after all source elements.
     */
    public constructor(sourceEnumerator: IEnumerator<T>, item: T) {
        super(sourceEnumerator);
        this.item = item;
    }

    protected override handleNext(): IteratorResult<T> {
        if (!this.isSourceDone) {
            const sourceNext = this.sourceEnumerator.next();
            if (!sourceNext.done) {
                return this.yield(sourceNext.value);
            }

            this.isSourceDone = true;
        }

        if (!this.appended) {
            this.appended = true;
            return this.yield(this.item);
        }

        return this.done();
    }
}