import { builtinOperator } from "../../plugin/builtinOperator";
import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";

/**
 * Projects each element through a selector.
 *
 * @remarks
 * Deferred. Source is not enumerated until the returned sequence is iterated.
 *
 * @see {@link TyneqSequence.select}
 * @group Operators
 * @category Streaming
 * @internal
 */
@builtinOperator({ name: "select", kind: "streaming" })
export class SelectEnumerator<T, U> extends TyneqEnumerator<T, U> {
    private readonly selector: (item: T) => U;

    
    public constructor(sourceEnumerator: Enumerator<T>, selector: (item: T) => U) {
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