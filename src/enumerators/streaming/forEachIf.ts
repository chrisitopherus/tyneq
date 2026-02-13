import { TyneqEnumerableEnumerator } from "../../core/enumerators/TyneqEnumerableEnumerator";
import { IEnumerable, IEnumerator } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

export class ForEachIfEnumerator<TSource> extends TyneqEnumerableEnumerator<TSource> {
    private readonly action: (item: TSource) => void;
    private readonly predicate: () => boolean;
    private iterated = false;
    private sourceEnumerator: IEnumerator<TSource> = null!;
    public constructor(sourceEnumerable: IEnumerable<TSource>, action: (item: TSource) => void, predicate: () => boolean) {
        super(sourceEnumerable);
        ArgumentUtility.checkNotOptional(action, nameof({ action }));
        ArgumentUtility.checkNotOptional(predicate, nameof({ predicate }));

        this.action = action;
        this.predicate = predicate;
    }

    protected override handleNext(): IteratorResult<TSource> {
        if (!this.iterated) {
            if (this.predicate()) {
                for (const item of this.sourceEnumerable) {
                    this.action(item);
                }
            }

            this.iterated = true;
            this.sourceEnumerator = this.sourceEnumerable[Symbol.iterator]();
        }

        const next = this.sourceEnumerator.next();
        if (next.done) {
            return this.done();
        }

        return this.yield(next.value);
    }
}