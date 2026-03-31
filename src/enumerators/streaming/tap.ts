import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";

/**
 * Invokes a side-effect action for each element without modifying the sequence.
 *
 * @remarks
 * Deferred. Source is not enumerated until the returned sequence is iterated.
 *
 * @see {@link TyneqSequence.tap}
 * @group Operators
 * @category Streaming
 * @internal
 */
export class TapEnumerator<TSource> extends TyneqEnumerator<TSource> {
    private readonly action: (item: TSource) => void;

    
    public constructor(sourceEnumerator: Enumerator<TSource>, action: (item: TSource) => void) {
        super(sourceEnumerator);
        this.action = action;
    }

    protected override handleNext(): IteratorResult<TSource> {
        const next = this.sourceEnumerator.next();
        if (next.done) {
            return this.done();
        }

        this.action(next.value);
        return this.yield(next.value);
    }
}