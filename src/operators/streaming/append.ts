import { TyneqEnumerator } from "../../core/enumerator";
import { EnumeratorResult, IEnumerator } from "../../types/core";


export class AppendEnumerator<T> extends TyneqEnumerator<T> {
    private isSourceDone = false;
    private appended = false;

    private readonly item: T;

    public constructor(sourceEnumerator: IEnumerator<T>, item: T) {
        super(sourceEnumerator);
        this.item = item;
    }

    protected override handleNext(): EnumeratorResult<T> {
        if (!this.isSourceDone) {
            const sourceNext = this.sourceEnumerator.next();
            if (!sourceNext.done) {
                return this.yield(sourceNext.value);
            }

            this.isSourceDone = true;
        }

        if (!this.appended) {
            this.appended = true;
            return this.yield(this.item);
        }

        return this.complete();
    }
}