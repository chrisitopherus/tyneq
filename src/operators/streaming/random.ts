import { TyneqOperator } from "../../core/operator/TyneqOperator";
import { RandomEnumerator } from "../../enumerators/streaming/random";
import { IEnumerator } from "../../types/core";

/**
 * Operator implementation for generating a sequence of values via a randomizer function.
 *
 * @remarks
 * Generates `count` elements by calling `randomizer` once per position. Used internally
 * by {@link Tyneq.random}. Delegates enumeration to {@link RandomEnumerator}.
 *
 * This method uses deferred execution. The source sequence is not enumerated until the returned sequence is iterated.
 *
 * @typeParam TSource - The type of values produced by the randomizer.
 *
 * @see {@link RandomEnumerator} for the enumeration implementation.
 *
 * @group Operators
 * @category Streaming
 * @internal
 */
export class RandomOperatorEnumerable<TSource> extends TyneqOperator<TSource> {
    private readonly count: number;
    private readonly randomizer: () => TSource;

    public constructor(count: number, randomizer: () => TSource) {
        super();
        this.randomizer = randomizer;
        this.count = count;
    }

    public override getEnumerator(): IEnumerator<TSource> {
        return new RandomEnumerator<TSource>(
            this.count,
            this.randomizer
        );
    }
}
