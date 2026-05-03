import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";
import { Nullable } from "../../types/utility";

/**
 * Flattens one level of nesting from a sequence of iterables.
 *
 * @remarks
 * Deferred. Source is not enumerated until the returned sequence is iterated.
 * Each inner iterable is consumed lazily as the outer sequence advances.
 *
 * @see {@link TyneqSequence.flatten}
 * @group Operators
 * @category Streaming
 * @internal
 */
export class FlattenEnumerator<TInner> extends TyneqEnumerator<Iterable<TInner>, TInner> {
    private innerEnumerator: Nullable<Enumerator<TInner>> = null;

    public constructor(sourceEnumerator: Enumerator<Iterable<TInner>>) {
        super(sourceEnumerator);
    }

    protected override handleNext(): IteratorResult<TInner> {
        while (true) {
            if (this.innerEnumerator !== null) {
                const innerNext = this.innerEnumerator.next();
                if (!innerNext.done) {
                    return this.yield(innerNext.value);
                }

                this.innerEnumerator = null;
            }

            const sourceNext = this.sourceEnumerator.next();
            if (sourceNext.done) {
                return this.done();
            }

            this.innerEnumerator = sourceNext.value[Symbol.iterator]();
        }
    }
}
