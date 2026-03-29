import { builtinOperator } from "../../plugin/builtinOperator";
import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { EnumeratorUtility } from "../../utility/EnumeratorUtility";

/**
 * Concatenates a second sequence after the source sequence.
 *
 * @remarks
 * Deferred. Source is not enumerated until the returned sequence is iterated.
 *
 * @see {@link TyneqSequence.concat}
 * @group Operators
 * @category Streaming
 * @internal
 */
@builtinOperator({ name: "concat", kind: "streaming" })
export class ConcatEnumerator<T> extends TyneqEnumerator<T> {
    private readonly otherEnumerator: Enumerator<T>;
    private isSourceDone = false;

    
    public constructor(sourceEnumerator: Enumerator<T>, other: Iterable<T>) {
        super(sourceEnumerator);
        this.otherEnumerator = other[Symbol.iterator]();
    }

    protected override disposeAdditional(): void {
        EnumeratorUtility.tryDispose(this.otherEnumerator);
    }

    protected override handleNext(): IteratorResult<T> {
        if (!this.isSourceDone) {
            const next = this.sourceEnumerator.next();
            if (!next.done) {
                return this.yield(next.value);
            }

            this.isSourceDone = true;
        }

        const next = this.otherEnumerator.next();
        if (!next.done) {
            return this.yield(next.value);
        }

        return this.done();
    }
}