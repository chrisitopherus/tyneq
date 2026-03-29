import { builtinOperator } from "../../plugin/builtinOperator";
import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";

/**
 * Skips elements from the beginning of the source sequence as long as a predicate is true.
 *
 * @remarks
 * Deferred. Source is not enumerated until the returned sequence is iterated.
 *
 * @see {@link TyneqSequence.skipWhile}
 * @group Operators
 * @category Streaming
 * @internal
 */
@builtinOperator({ name: "skipWhile", kind: "streaming" })
export class SkipWhileEnumerator<T> extends TyneqEnumerator<T> {
    private readonly predicate: (item: T) => boolean;
    private isSkipping = true;

    
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