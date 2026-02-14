import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

export class TapIfEnumerator<TSource> extends TyneqEnumerator<TSource> {
    private readonly action: (item: TSource) => void;
    private readonly predicate: () => boolean;

    public constructor(sourceEnumerator: IEnumerator<TSource>, action: (item: TSource) => void, predicate: () => boolean) {
        super(sourceEnumerator);
        ArgumentUtility.checkNotOptional(action, nameof({ action }));
        ArgumentUtility.checkNotOptional(predicate, nameof({ predicate }));

        this.action = action;
        this.predicate = predicate;
    }

    protected override handleNext(): IteratorResult<TSource> {
        const next = this.sourceEnumerator.next();
        if (next.done) {
            return this.done();
        }

        if (this.predicate()) {
            this.action(next.value);
        }

        return this.yield(next.value);
    }
}