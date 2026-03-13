import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from "../../types/core";
import { EnumeratorUtility } from "../../utility/EnumeratorUtility";
import { operator } from '../../extensibility/operatorDecorators';

/**
 * Enumerator that combines two sequences pairwise using a selector function.
 *
 * @remarks
 * This method uses deferred execution. The source sequence is not enumerated until the returned sequence is iterated.
 *
 * Pulls one element from each sequence per iteration and applies the selector to produce an output element.
 * Terminates as soon as either sequence is exhausted (shortest-sequence semantics).
 * Properly disposes the secondary enumerator on completion or early termination.
 *
 * @typeParam T - The type of elements in the first (source) sequence.
 * @typeParam U - The type of elements in the second sequence.
 * @typeParam V - The type of elements produced by the selector.
 *
 * @group Enumerators
 * @internal
 */
@operator('zip')
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
