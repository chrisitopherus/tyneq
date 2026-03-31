import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { EnumeratorUtility } from "../../utility/EnumeratorUtility";

// TODO: This implementation is not memory efficient. Consider implementing a more efficient version that does not require buffering the entire source and other enumerables.
// TODO: Consider rethinking the API to allow for a more efficient implementation. For example, instead of specifying the back index, we could specify a predicate that determines where to insert the other enumerable.
// TODO: Consider rethinking the way it should work, the current implementation is not intuitive - inserting at the beginning prepends the other source but backsert at 0 does not append but instead the last element of the source remains to be the last.

/**
 * Inserts a second sequence at a specified offset from the end of the source sequence.
 *
 * @remarks
 * Deferred. Source is fully buffered on the first iteration of the returned sequence.
 *
 * @see {@link TyneqSequence.backsert}
 * @group Operators
 * @category Buffering
 * @internal
 */
export class BacksertEnumerator<T> extends TyneqEnumerator<T> {
    private readonly other: Iterable<T>;
    private readonly backIndex: number;
    private buffer: T[] = [];
    private current = 0;

    
    public constructor(sourceEnumerator: Enumerator<T>, backIndex: number, other: Iterable<T>) {
        super(sourceEnumerator);
        this.backIndex = backIndex;
        this.other = other;
    }

    protected override initialize(): void {
        const source = Array.from(EnumeratorUtility.toIterable(this.sourceEnumerator));
        const other = Array.from(this.other);

        const insertionIndex = source.length === 0
            ? 0
            : Math.max(0, source.length - 1 - this.backIndex);

        this.buffer = [
            ...source.slice(0, insertionIndex),
            ...other,
            ...source.slice(insertionIndex)
        ];

        this.current = 0;
    }

    protected override handleNext(): IteratorResult<T> {
        if (this.current >= this.buffer.length) {
            return this.done();
        }

        return this.yield(this.buffer[this.current++]);
    }
}