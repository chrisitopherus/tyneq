import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from "../../types/core";
import { operator } from '../../extensibility/operatorDecorators';

/**
 * Enumerator that concatenates two sequences.
 *
 * @remarks
 * This method uses deferred execution. The source sequence is not enumerated until the returned sequence is iterated.
 *
 * Yields all source elements first, then all elements from the second sequence.
 *
 * @typeParam T - The type of elements in both sequences.
 *
 * @group Enumerators
 * @internal
 */
@operator('concat')
export class ConcatEnumerator<T> extends TyneqEnumerator<T> {
    private readonly otherEnumerator: IEnumerator<T>;
    private isSourceDone = false;

    /**
     * @param sourceEnumerator - The first enumerator.
     * @param other - The second sequence to concatenate after the source.
     */
    public constructor(sourceEnumerator: IEnumerator<T>, other: Iterable<T>) {
        super(sourceEnumerator);
        this.otherEnumerator = other[Symbol.iterator]();
    }

    protected override handleNext(): IteratorResult<T> {
        if (!this.isSourceDone) {
            const next = this.sourceEnumerator.next();
            if (!next.done) {
                return this.yield(next.value);
            }

            this.isSourceDone = true;
        }

        const next = this.otherEnumerator.next();
        if (!next.done) {
            return this.yield(next.value);
        }

        return this.done();
    }
}
