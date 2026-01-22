import { EnumeratorResult } from "../../core/enumeratorResult";
import { IEnumerable, IEnumerator } from "../../types/core";

export class AppendEnumerator<T> implements IEnumerator<T> {
    private isSourceDone = false;

    private readonly sourceEnumerator: IEnumerator<T>;
    private readonly itemsEnumerator: IEnumerator<T>;

    public constructor(sourceEnumerator: IEnumerator<T>, items: IEnumerable<T>) {
        this.sourceEnumerator = sourceEnumerator;
        this.itemsEnumerator = items[Symbol.iterator]();
    }

    public next(): IteratorResult<T> {
        if (!this.isSourceDone) {
            const sourceNext = this.sourceEnumerator.next();
            if (!sourceNext.done) {
                return EnumeratorResult.yield(sourceNext.value);
            }

            this.isSourceDone = true;
        }

        const nextItem = this.itemsEnumerator.next();
        if (!nextItem.done) {
            return EnumeratorResult.yield(nextItem.value);
        }

        return EnumeratorResult.done<T>();
    }
}