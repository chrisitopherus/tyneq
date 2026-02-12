import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from "../../types/core";
import { EnumeratorUtility } from "../../utility/EnumeratorUtility";

export class ZipEnumerator<T, U, V> extends TyneqEnumerator<T, V> {
    private readonly otherEnumerator: IEnumerator<U>;
    private readonly selector: (first: T, second: U) => V;

    public constructor(sourceEnumerator: IEnumerator<T>, otherEnumerator: IEnumerator<U>, selector: (first: T, second: U) => V) {
        super(sourceEnumerator);
        this.otherEnumerator = otherEnumerator;
        this.selector = selector;
    }

    protected override handleNext(): IteratorResult<V> {
        const first = this.sourceEnumerator.next();
        if (first.done) {
            this.disposeAdditional();
            return this.done();
        }

        const second = this.otherEnumerator.next();
        if (second.done) {
            return this.earlyComplete();
        }

        return this.yield(this.selector(first.value, second.value));
    }

    protected override disposeAdditional(): void {
        EnumeratorUtility.tryDispose(this.otherEnumerator);
    }
}