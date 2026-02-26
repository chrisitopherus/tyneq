import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from "../../types/core";
import { EnumeratorUtility } from "../../utility/EnumeratorUtility";

// TODO: This implementation is not memory efficient. Consider implementing a more efficient version that does not require buffering the entire source and other enumerables.
// TODO: Consider rethinking the API to allow for a more efficient implementation. For example, instead of specifying the back index, we could specify a predicate that determines where to insert the other enumerable.
// TODO: Consider rethinking the way it should work, the current implementation is not intuitive - inserting at the beginning prepends the other source but backsert at 0 does not append but instead the last element of the source remains to be the last.
export class BacksertEnumerator<T> extends TyneqEnumerator<T> {
    private readonly otherEnumerator: IEnumerator<T>;
    private readonly backIndex: number;
    private initialized = false;
    private buffer: T[] = [];
    private current = 0;

    public constructor(sourceEnumerator: IEnumerator<T>, otherEnumerator: IEnumerator<T>, backIndex: number) {
        super(sourceEnumerator);
        this.otherEnumerator = otherEnumerator;
        this.backIndex = backIndex;
    }

    protected override disposeAdditional(): void {
        EnumeratorUtility.tryDispose(this.otherEnumerator);
    }

    protected override handleNext(): IteratorResult<T> {
        if (!this.initialized) {
            const source = Array.from(EnumeratorUtility.toIterable(this.sourceEnumerator));
            const other = Array.from(EnumeratorUtility.toIterable(this.otherEnumerator));

            const insertionIndex = source.length === 0
                ? 0
                : Math.max(0, source.length - 1 - this.backIndex);

            this.buffer = [
                ...source.slice(0, insertionIndex),
                ...other,
                ...source.slice(insertionIndex)
            ];

            this.initialized = true;
            this.current = 0;
        }

        if (this.current >= this.buffer.length) {
            return this.done();
        }

        return this.yield(this.buffer[this.current++]);
    }
}
