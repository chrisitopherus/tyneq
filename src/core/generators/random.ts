import { TyneqBaseEnumerator } from "../enumerators/TyneqBaseEnumerator";

/**
 * Enumerator that generates a fixed-length sequence by calling a randomizer function.
 *
 * @remarks
 * Deferred. Values are generated on demand.
 *
 * Invokes `randomizer` once per element position, up to `count` times.
 *
 * @group Enumerators
 * @internal
 */
export class RandomEnumerator<TSource> extends TyneqBaseEnumerator<TSource> {
    private readonly count: number;
    private readonly randomizer: () => TSource;

    private yieldedCount: number = 0;

    /**
     * @param count - Number of elements to generate.
     * @param randomizer - Factory called once per element to produce a value.
     */
    public constructor(count: number, randomizer: () => TSource) {
        super();
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

    protected override handleNext(): IteratorResult<TSource> {
        if (this.yieldedCount >= this.count) {
            return this.done();
        }

        this.yieldedCount++;
        return this.yield(this.randomizer());
    }
}
