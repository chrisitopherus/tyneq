import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { EnumeratorUtility } from "../../utility/EnumeratorUtility";
import { operator } from '../../extensibility/operatorDecorators';

/**
 * Enumerator that combines two sequences pairwise using a selector function.
 *
 * @remarks
 * Deferred. Source is not enumerated until iteration begins.
 *
 * Pulls one element from each sequence per iteration and applies the selector to produce an output element.
 * Terminates as soon as either sequence is exhausted (shortest-sequence semantics).
 * Properly disposes the secondary enumerator on completion or early termination.
 *
 * @group Enumerators
 * @internal
 */
@operator<[other: unknown, selector: unknown]>('zip', (other, selector) => {
    ArgumentUtility.checkNotOptional({ other });
    ArgumentUtility.checkIterable({ other });
    ArgumentUtility.checkNotOptional({ selector });
})
export class ZipEnumerator<T, U, V> extends TyneqEnumerator<T, V> {
    private readonly otherEnumerator: IEnumerator<U>;
    private readonly selector: (first: T, second: U) => V;

    /**
     * @param sourceEnumerator - The first sequence to zip.
     * @param other - The second sequence to zip with the source.
     * @param selector - Combines one element from each sequence into the output element.
     */
    public constructor(sourceEnumerator: IEnumerator<T>, other: Iterable<U>, selector: (first: T, second: U) => V) {
        super(sourceEnumerator);
        this.otherEnumerator = other[Symbol.iterator]();
        this.selector = selector;
    }

    protected override handleNext(): IteratorResult<V> {
        const first = this.sourceEnumerator.next();
        if (first.done) {
            this.disposeAdditional();
            return this.done();
        }

        const second = this.otherEnumerator.next();
        if (second.done) {
            return this.earlyComplete();
        }

        return this.yield(this.selector(first.value, second.value));
    }

    protected override disposeAdditional(): void {
        EnumeratorUtility.tryDispose(this.otherEnumerator);
    }
}
