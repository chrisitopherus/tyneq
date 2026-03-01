import { TyneqBaseEnumerator } from "../../core/enumerators/TyneqBaseEnumerator";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";


export class RandomEnumerator<TSource> extends TyneqBaseEnumerator<TSource> {
    private readonly count: number;
    private readonly randomizer: () => TSource;

    private yieldedCount: number = 0;

    public constructor(count: number, randomizer: () => TSource) {
        super();
        ArgumentUtility.checkNonNegative({ count });
        ArgumentUtility.checkNotOptional({ randomizer });

        this.count = count;
        this.randomizer = randomizer;
    }

    protected override dispose(value?: unknown): void {
        this.disposeSource();
        this.disposeAdditional(value);
    }

    protected override disposeSource(): void {
        if (this.sourceDisposed) return;
        this.sourceDisposed = true;
    }

    /**
     * Generates the next value in the random sequence.
     * 
     * @returns Iterator result containing the next value, or done when end is exceeded.
     */
    protected override handleNext(): IteratorResult<TSource> {
        if (this.yieldedCount >= this.count) {
            return this.done();
        }

        this.yieldedCount++;
        return this.yield(this.randomizer());
    }
}