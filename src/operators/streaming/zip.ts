import { TyneqEnumerator } from "../../core/enumerator";
import { EnumeratorResult, IEnumerator } from "../../types/core";

export class ZipEnumerator<T, U, V> extends TyneqEnumerator<T, V> {
    private readonly otherEnumerator: IEnumerator<T>;
    private selector: (first: T, second: T) => V;

    public constructor(sourceEnumerator: IEnumerator<T>, otherEnumerator: IEnumerator<T>, selector: (first: T, second: T) => V) {
        super(sourceEnumerator);
        this.otherEnumerator = otherEnumerator;
        this.selector = selector;
    }

    protected override handleNext(): EnumeratorResult<V> {
        const first = this.sourceEnumerator.next();
        if (first.done) {
            return this.complete();
        }

        const second = this.otherEnumerator.next();
        if (second.done) {
            return this.complete();
        }

        return this.yield(this.selector(first.value, second.value));
    }
}