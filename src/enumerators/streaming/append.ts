import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";

/**
 * Appends a single element to the end of the source sequence.
 *
 * @remarks
 * Deferred. Source is not enumerated until the returned sequence is iterated.
 *
 * @see {@link TyneqSequence.append}
 * @group Operators
 * @category Streaming
 * @internal
 */
export class AppendEnumerator<T> extends TyneqEnumerator<T> {
    private isSourceDone = false;
    private appended = false;
    private readonly item: T;

    
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