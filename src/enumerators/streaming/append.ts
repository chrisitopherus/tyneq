import { builtinOperator } from "../../extensions/builtinOperator";
import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";

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
export class AppendEnumerator<T> extends TyneqEnumerator<T> {
    private isSourceDone = false;
    private appended = false;
    private readonly item: T;

    /**
     * @param sourceEnumerator - The upstream enumerator to wrap.
     * @param item - The element to append after all source elements.
     */
    public constructor(sourceEnumerator: Enumerator<T>, item: T) {
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