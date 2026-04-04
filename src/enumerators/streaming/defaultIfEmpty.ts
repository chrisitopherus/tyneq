import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";

/**
 * Returns the source sequence, or a single default element if the source is empty.
 *
 * @remarks
 * Deferred. Source is not enumerated until the returned sequence is iterated.
 *
 * @see {@link TyneqSequence.defaultIfEmpty}
 * @group Operators
 * @category Streaming
 * @internal
 */
export class DefaultIfEmptyEnumerator<TSource> extends TyneqEnumerator<TSource> {
    private readonly defaultValue: TSource;
    private sourceDone = false;
    private hasYieldedAny = false;
    private defaultYielded = false;

    
    public constructor(sourceEnumerator: Enumerator<TSource>, defaultValue: TSource) {
        super(sourceEnumerator);
        this.defaultValue = defaultValue;
    }

    protected override handleNext(): IteratorResult<TSource> {
        if (!this.sourceDone) {
            const next = this.sourceEnumerator.next();
            if (!next.done) {
                this.hasYieldedAny = true;
                return this.yield(next.value);
            }

            this.sourceDone = true;
        }

        if (!this.hasYieldedAny && !this.defaultYielded) {
            this.defaultYielded = true;
            return this.doneWithYield(this.defaultValue);
        }

        return this.done();
    }
}