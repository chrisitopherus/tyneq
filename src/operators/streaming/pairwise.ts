import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { PairwiseEnumerator } from "../../enumerators/streaming/pairwise";
import { IEnumerable, IEnumerator } from "../../types/core";

export class PairwiseOperatorEnumerable<TSource> extends TyneqOperatorEnumerable<TSource, [TSource, TSource]> {
    public constructor(source: IEnumerable<TSource>) {
        super(source);
    }

    public override getEnumerator(): IEnumerator<[TSource, TSource]> {
        return new PairwiseEnumerator<TSource>(this.source[Symbol.iterator]());
    }
}
