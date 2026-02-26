import { TyneqOperator } from "../../core/operator/TyneqOperator";
import { RandomEnumerator } from "../../enumerators/streaming/random";
import { IEnumerator } from "../../types/core";

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
