import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

export class SplitEnumerator<TSource> extends TyneqEnumerator<TSource, TSource[]> {
    private readonly splitOn: (item: TSource) => boolean;

    public constructor(sourceEnumerator: IEnumerator<TSource>, splitOn: (item: TSource) => boolean) {
        super(sourceEnumerator);
        ArgumentUtility.checkNotOptional(splitOn, nameof({ splitOn }));

        this.splitOn = splitOn;
    }

    protected handleNext(): IteratorResult<TSource[], any> {
        const currentSplit: TSource[] = [];

        while (true) {
            const { value, done } = this.sourceEnumerator.next();
            if (done) {
                if (currentSplit.length > 0) {
                    return this.doneWithYield(currentSplit);
                }

                return this.done();
            }

            if (this.splitOn(value)) {
                if (currentSplit.length > 0) {
                    return this.yield(currentSplit);
                }
            } else {
                currentSplit.push(value);
            }
        }
    }
}