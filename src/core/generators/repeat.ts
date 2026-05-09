import { TyneqBaseEnumerator } from "../enumerators/TyneqBaseEnumerator";

/**
 * Yields a single value a fixed number of times.
 *
 * @group Operators
 * @category Streaming
 * @internal
 */
export class RepeatEnumerator<TSource> extends TyneqBaseEnumerator<TSource> {
    private readonly value: TSource;
    private readonly count: number;

    private yieldedCount: number = 0;

    public constructor(value: TSource, count: number) {
        super();
        this.count = count;
        this.value = value;
    }

    protected override handleNext(): IteratorResult<TSource> {
        if (this.yieldedCount >= this.count) {
            return this.done();
        }

        this.yieldedCount++;
        return this.yieldedCount === this.count
            ? this.doneWithYield(this.value)
            : this.yield(this.value);
    }
}
