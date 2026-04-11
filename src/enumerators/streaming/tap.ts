import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";
import { ItemAction } from "../../types/utility";
import { ArgumentUtility } from "../../utility/ArgumentUtility";

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
    private readonly action: ItemAction<TSource>;
    private index: number = 0;


    public constructor(sourceEnumerator: Enumerator<TSource>, action: ItemAction<TSource>) {
        super(sourceEnumerator);
        this.action = action;
    }

    protected override handleNext(): IteratorResult<TSource> {
        const next = this.sourceEnumerator.next();
        if (next.done) {
            return this.done();
        }

        this.action(next.value, this.index++);
        return this.yield(next.value);
    }
}