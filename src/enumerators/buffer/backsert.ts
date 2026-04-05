import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";
import { EnumeratorUtility } from "../../utility/EnumeratorUtility";

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

        const insertionIndex = Math.max(0, source.length - this.backIndex);

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