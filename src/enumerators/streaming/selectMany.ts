import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";
import { Nullable } from "../../types/utility";
import { ArgumentUtility } from "../../utility/ArgumentUtility";

/**
 * Flattens each element into a sub-sequence and yields each element of those sub-sequences.
 *
 * @remarks
 * Deferred. Source is not enumerated until the returned sequence is iterated.
 *
 * @see {@link TyneqSequence.selectMany}
 * @group Operators
 * @category Streaming
 * @internal
 */
export class SelectManyEnumerator<T, U> extends TyneqEnumerator<T, U> {
    private readonly selector: (item: T) => Iterable<U>;
    private innerEnumerator: Nullable<Enumerator<U>> = null;

    
    public constructor(sourceEnumerator: Enumerator<T>, selector: (item: T) => Iterable<U>) {
        super(sourceEnumerator);
        this.selector = selector;
    }

    protected override handleNext(): IteratorResult<U> {
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

            this.innerEnumerator = this.selector(sourceNext.value)[Symbol.iterator]();
        }
    }
}