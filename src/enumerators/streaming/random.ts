import { TyneqBaseEnumerator } from "../../core/enumerators/TyneqBaseEnumerator";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

/**
 * Enumerator implementation for generating a sequence of values produced by a randomizer function.
 *
 * @remarks
 * Calls the provided `randomizer` function once per element position, up to the specified
 * `count`. Yields values without buffering; each call to `handleNext` invokes the randomizer
 * once and yields the result.
 *
 * **Performance**: O(1) space (streaming). O(count) time when fully enumerated.
 *
 * @typeParam TSource - The type of values produced by the randomizer.
 *
 * @group Enumerators
 * @internal
 */
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