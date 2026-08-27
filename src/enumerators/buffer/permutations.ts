import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { EnumeratorUtility } from "../../utility/EnumeratorUtility";

/**
 * Yields all permutations of the elements in the source sequence.
 *
 * @remarks
 * Deferred. Source is fully buffered on the first iteration of the returned sequence.
 *
 * @see {@link TyneqSequence.permutations}
 * @group Operators
 * @category Buffering
 * @internal
 */
export class PermutationsEnumerator<TSource> extends TyneqEnumerator<TSource, TSource[]> {
    private buffer: TSource[] = [];
    private c: number[] = [];
    private n = 0;
    private i = -1;

    protected override initialize(): void {
        this.buffer = Array.from(EnumeratorUtility.toIterable(this.sourceEnumerator));
        this.n = this.buffer.length;
        this.c = new Array(this.n).fill(0);
    }

    protected override handleNext(): IteratorResult<TSource[]> {
        if (this.i === -1) {
            this.i = 1;
            return this.yield([...this.buffer]);
        }

        while (this.i < this.n) {
            if (this.c[this.i] < this.i) { // can we swap?
                const swapIndex = this.i % 2 === 0
                    ? 0
                    : this.c[this.i];
                [this.buffer[swapIndex], this.buffer[this.i]] = [this.buffer[this.i], this.buffer[swapIndex]];
                this.c[this.i]++;
                this.i = 1;
                return this.yield([...this.buffer]);
            } else {
                this.c[this.i] = 0;
                this.i++; // go deeper
            }
        }

        return this.done();
    }

}