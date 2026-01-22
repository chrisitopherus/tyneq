import { EnumeratorResult } from "../../core/enumeratorResult";
import { IEnumerator } from "../../types/core";

export class PrependEnumerator<T> implements IEnumerator<T> {
    private prepended = false;

    private readonly sourceEnumerator: IEnumerator<T>;
    private readonly item: T;

    public constructor(sourceEnumerator: IEnumerator<T>, item: T) {
        this.sourceEnumerator = sourceEnumerator;
        this.item = item;
    }

    public next(): IteratorResult<T> {
        if (!this.prepended) {
            this.prepended = true;
            return EnumeratorResult.yield(this.item);
        }

        const nextItem = this.sourceEnumerator.next();
        if (!nextItem.done) {
            return EnumeratorResult.yield(nextItem.value);
        }

        return EnumeratorResult.done<T>();
    }
}