import { TyneqBaseEnumerator } from "../enumerators/TyneqBaseEnumerator";

export class RandomEnumerator<TSource> extends TyneqBaseEnumerator<TSource> {
    private readonly count: number;
    private readonly randomizer: () => TSource;

    private yieldedCount: number = 0;

    public constructor(count: number, randomizer: () => TSource) {
        super();
        this.count = count;
        this.randomizer = randomizer;
    }

    protected override handleNext(): IteratorResult<TSource> {
        if (this.yieldedCount >= this.count) {
            return this.done();
        }

        this.yieldedCount++;
        return this.yield(this.randomizer());
    }
}
