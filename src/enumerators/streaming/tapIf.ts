import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";
import { ItemAction } from "../../types/utility";
import { ArgumentUtility } from "../../utility/ArgumentUtility";

/**
 * Conditionally invokes a side-effect action for each element based on a predicate.
 *
 * @remarks
 * Deferred. Source is not enumerated until the returned sequence is iterated.
 *
 * @see {@link TyneqSequence.tapIf}
 * @group Operators
 * @category Streaming
 * @internal
 */
export class TapIfEnumerator<TSource> extends TyneqEnumerator<TSource> {
    private readonly action: ItemAction<TSource>;
    private readonly predicate: () => boolean;
    private index: number = 0;


    public constructor(sourceEnumerator: Enumerator<TSource>, action: ItemAction<TSource>, predicate: () => boolean) {
        super(sourceEnumerator);
        this.action = action;
        this.predicate = predicate;
    }

    protected override handleNext(): IteratorResult<TSource> {
        const next = this.sourceEnumerator.next();
        if (next.done) {
            return this.done();
        }

        if (this.predicate()) {
            this.action(next.value, this.index);
        }

        this.index++;
        return this.yield(next.value);
    }
}