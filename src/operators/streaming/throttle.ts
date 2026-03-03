import type { IEnumerable, IEnumerator } from "../../types/core";
import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { ThrottleEnumerator } from "../../enumerators/streaming/throttle";

export class ThrottleOperatorEnumerable<TSource> extends TyneqOperatorEnumerable<TSource> {
    private readonly count: number;

    public constructor(source: IEnumerable<TSource>, count: number) {
        super(source);
        this.count = count;
    }

    public override getEnumerator(): IEnumerator<TSource> {
        return new ThrottleEnumerator<TSource>(this.source[Symbol.iterator](), this.count);
    }
}