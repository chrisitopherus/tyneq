import { TyneqSourceEnumerator } from "../../core/enumerators/TyneqSourceEnumerator";
import { IEnumerator } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { operator } from "../../extensibility/operator";
import { EnumeratorUtility } from "../../utility/enumeratorUtility";

/**
 * Enumerator that concatenates two sequences.
 *
 * @remarks
 * Deferred. Source is not enumerated until iteration begins.
 *
 * Yields all source elements first, then all elements from the second sequence.
 *
 * @group Enumerators
 * @internal
 */
@operator<[other: unknown]>("concat", (other) => {
    ArgumentUtility.checkNotOptional({ other });
    ArgumentUtility.checkIterable({ other });
})
export class ConcatEnumerator<T> extends TyneqSourceEnumerator<T> {
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

    protected override disposeAdditional(): void {
        EnumeratorUtility.tryDispose(this.otherEnumerator);
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
