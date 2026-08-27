import { ItemSelector } from "../../types/utility";
import { TyneqBaseEnumerator } from "../enumerators/TyneqBaseEnumerator";

/**
 * Yields a sequence produced by repeatedly applying a selector to the previous element.
 *
 * @group Operators
 * @category Streaming
 * @internal
 */
export class GenerateEnumerator<TSource, TResult extends TSource> extends TyneqBaseEnumerator<TSource, TResult> {
    private readonly nextSelector: ItemSelector<TSource, TResult>;
    private readonly count: number;

    private value: TSource;
    private yieldedCount: number = 0;
    private index: number = 0;

    public constructor(seed: TSource, next: ItemSelector<TSource, TResult>, count?: number) {
        super();
        this.value = seed;
        this.nextSelector = next;
        this.count = count ?? Infinity;
    }

    protected override handleNext(): IteratorResult<TResult> {
        if (this.yieldedCount >= this.count) {
            return this.done();
        }

        const result = this.nextSelector(this.value, this.index++);
        this.value = result;
        this.yieldedCount++;
        return this.yield(result);
    }
}
