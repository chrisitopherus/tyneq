import { Enumerable } from "../../core/enumerable";
import { EnumeratorResult } from "../../core/enumeratorResult";
import { IEnumerable, IEnumerator } from "../../types/core";
import { Nullable } from '../../types/utility';

export class SelectManyEnumerator<T, U> implements IEnumerator<U> {
    private readonly sourceEnumerator: IEnumerator<T>;
    private readonly selector: (item: T) => IEnumerable<U>;

    private innerEnumerator: Nullable<IEnumerator<U>> = null;

    public constructor(sourceEnumerator: IEnumerator<T>, selector: (item: T) => IEnumerable<U>) {
        this.sourceEnumerator = sourceEnumerator;
        this.selector = selector;
    }

    public next(): IteratorResult<U> {
        while (true) {
            if (this.innerEnumerator !== null) {
                const innerNext = this.innerEnumerator.next();
                if (!innerNext.done) {
                    return EnumeratorResult.yield(innerNext.value);
                }

                this.innerEnumerator = null;
            }

            const sourceNext = this.sourceEnumerator.next();
            if (sourceNext.done) {
                return EnumeratorResult.done<U>();
            }

            this.innerEnumerator = this.selector(sourceNext.value)[Symbol.iterator]();
        }
    }
}