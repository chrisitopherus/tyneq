import { builtinOperator } from "../../plugin/builtinOperator";
import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";

/**
 * Yields elements from the beginning of the source sequence as long as a predicate is true.
 *
 * @remarks
 * Deferred. Source is not enumerated until the returned sequence is iterated.
 *
 * @see {@link TyneqSequence.takeWhile}
 * @group Operators
 * @category Streaming
 * @internal
 */
@builtinOperator({ name: "takeWhile", kind: "streaming" })
export class TakeWhileEnumerator<T> extends TyneqEnumerator<T> {
    private readonly predicate: (value: T) => boolean;

    
    public constructor(sourceEnumerator: Enumerator<T>, predicate: (value: T) => boolean) {
        super(sourceEnumerator);
        this.predicate = predicate;
    }

    protected override handleNext(): IteratorResult<T> {
        const result = this.sourceEnumerator.next();
        if (result.done) {
            return this.done();
        }

        if (this.predicate(result.value)) {
            return this.yield(result.value);
        }

        return this.earlyComplete();
    }
}