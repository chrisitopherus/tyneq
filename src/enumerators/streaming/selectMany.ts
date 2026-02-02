import { TyneqEnumerator } from "../../core/TyneqEnumerator";
import { EnumeratorResult, IEnumerable, IEnumerator } from "../../types/core";
import { Nullable } from '../../types/utility';

export class SelectManyEnumerator<T, U> extends TyneqEnumerator<T, U> {
    private readonly selector: (item: T) => IEnumerable<U>;

    private innerEnumerator: Nullable<IEnumerator<U>> = null;

    public constructor(sourceEnumerator: IEnumerator<T>, selector: (item: T) => IEnumerable<U>) {
        super(sourceEnumerator);
        this.selector = selector;
    }

    protected override handleNext(): EnumeratorResult<U> {
        while (true) {
            if (this.innerEnumerator !== null) {
                const innerNext = this.innerEnumerator.next();
                if (!innerNext.done) {
                    return this.yield(innerNext.value);
                }

                this.innerEnumerator = null;
            }

            const sourceNext = this.sourceEnumerator.next();
            if (sourceNext.done) {
                return this.complete();
            }

            this.innerEnumerator = this.selector(sourceNext.value)[Symbol.iterator]();
        }
    }
}