import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { EnumeratorUtility } from "../../utility/EnumeratorUtility";
import { operator } from '../../extensibility/operatorDecorators';

// TODO: This implementation is not memory efficient. Consider implementing a more efficient version that does not require buffering the entire source and other enumerables.
// TODO: Consider rethinking the API to allow for a more efficient implementation. For example, instead of specifying the back index, we could specify a predicate that determines where to insert the other enumerable.
// TODO: Consider rethinking the way it should work, the current implementation is not intuitive - inserting at the beginning prepends the other source but backsert at 0 does not append but instead the last element of the source remains to be the last.
/**
 * Enumerator that inserts a sequence at a position measured from the end of the source.
 *
 * @remarks
 * Deferred. Source is fully buffered on first iteration.
 *
 * Buffers both the source and the other sequence on first iteration. The insertion point is
 * `source.length - 1 - backIndex`. Elements before that index come from source, then all
 * elements from other, then the remaining source elements.
 *
 * @group Enumerators
 * @internal
 */
@operator<[backIndex: unknown, other: unknown]>('backsert', 'buffer', (_backIndex, other) => {
    ArgumentUtility.checkNotOptional({ other });
    ArgumentUtility.checkIterable({ other });
})
export class BacksertEnumerator<T> extends TyneqEnumerator<T> {
    private readonly other: Iterable<T>;
    private readonly backIndex: number;
    private buffer: T[] = [];
    private current = 0;

    /**
     * @param sourceEnumerator - The upstream enumerator to wrap.
     * @param backIndex - Distance from the last element where `other` is inserted.
     * @param other - The sequence to insert at the computed position.
     */
    public constructor(sourceEnumerator: IEnumerator<T>, backIndex: number, other: Iterable<T>) {
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
