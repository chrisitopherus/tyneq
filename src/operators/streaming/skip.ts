import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { SkipEnumerator } from "../../enumerators/streaming/skip";
import { IEnumerable, IEnumerator, IteratorFactory } from "../../types/core";

export class SkipOperatorEnumerable<TSource> extends TyneqOperatorEnumerable<TSource> {
    private readonly count: number;

    public constructor(source: IEnumerable<TSource>, count: number) {
        super(source);
        this.count = count;
    }

    public getFactory(): IteratorFactory<TSource> {
        const source = this.source;
        const count = this.count;

        return () => {
            return new SkipEnumerator<TSource>(source[Symbol.iterator](), count);
        }
    }

    public override getEnumerator(): IEnumerator<TSource> {
        return new SkipEnumerator<TSource>(this.source[Symbol.iterator](), this.count);
    }
}