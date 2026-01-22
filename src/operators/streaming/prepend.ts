import { EnumeratorResult } from "../../core/enumeratorResult";
import { IEnumerable, IEnumerator } from "../../types/core";

export class PrependEnumerator<T> implements IEnumerator<T> {
    private isItemsDone = false;

    private readonly sourceEnumerator: IEnumerator<T>;
    private readonly itemsEnumerator: IEnumerator<T>;

    public constructor(sourceEnumerator: IEnumerator<T>, items: IEnumerable<T>) {
        this.sourceEnumerator = sourceEnumerator;
        this.itemsEnumerator = items[Symbol.iterator]();
    }

    public next(): IteratorResult<T> {
        if (!this.isItemsDone) {
            const itemsNext = this.itemsEnumerator.next();
            if (!itemsNext.done) {
                return EnumeratorResult.yield(itemsNext.value);
            }

            this.isItemsDone = true;
        }

        const nextItem = this.sourceEnumerator.next();
        if (!nextItem.done) {
            return EnumeratorResult.yield(nextItem.value);
        }

        return EnumeratorResult.done<T>();
    }
}