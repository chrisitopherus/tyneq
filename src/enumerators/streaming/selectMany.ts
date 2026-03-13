import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerable, IEnumerator } from "../../types/core";
import { Nullable } from '../../types/utility';
import { operator } from '../../extensibility/operatorDecorators';

/**
 * Enumerator that projects each element to a nested sequence and flattens the results.
 *
 * @remarks
 * This method uses deferred execution. The source sequence is not enumerated until the returned sequence is iterated.
 *
 * Applies the selector to each source element to obtain a nested sequence, then yields all
 * elements of each nested sequence in order (flatMap semantics).
 *
 * @typeParam T - The type of elements in the source sequence.
 * @typeParam U - The type of elements in the flattened result sequence.
 *
 * @group Enumerators
 * @internal
 */
@operator('selectMany')
export class SelectManyEnumerator<T, U> extends TyneqEnumerator<T, U> {
    private readonly selector: (item: T) => Iterable<U>;
    private innerEnumerator: Nullable<IEnumerator<U>> = null;

    /**
     * @param sourceEnumerator - The upstream enumerator to wrap.
     * @param selector - Maps each source element to a nested sequence to flatten.
     */
    public constructor(sourceEnumerator: IEnumerator<T>, selector: (item: T) => Iterable<U>) {
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
