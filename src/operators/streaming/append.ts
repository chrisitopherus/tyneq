import { EnumeratorResult } from "../../core/enumeratorResult";
import { IEnumerable, IEnumerator } from "../../types/core";


export class AppendEnumerator<T> implements IEnumerator<T> {
    private isSourceDone = false;
    private appended = false;

    private readonly sourceEnumerator: IEnumerator<T>;
    private readonly item: T;

    public constructor(sourceEnumerator: IEnumerator<T>, item: T) {
        this.sourceEnumerator = sourceEnumerator;
        this.item = item;
    }

    public next(): IteratorResult<T> {
        if (!this.isSourceDone) {
            const sourceNext = this.sourceEnumerator.next();
            if (!sourceNext.done) {
                return EnumeratorResult.yield(sourceNext.value);
            }

            this.isSourceDone = true;
        }

        if (!this.appended) {
            this.appended = true;
            return EnumeratorResult.yield(this.item);
        }

        return EnumeratorResult.done<T>();
    }
}