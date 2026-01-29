import { TyneqOperator } from "../../core/operator/TyneqOperator";
import { SkipLastEnumerator } from "../../enumerators/streaming/skipLast";
import { IEnumerable, IteratorFactory } from "../../types/core";

export class SkipLastOperator<TSource> extends TyneqOperator<TSource> {
    private readonly count: number;

    public constructor(source: IEnumerable<TSource>, count: number) {
        super(source);
        this.count = count;
    }

    public getFactory(): IteratorFactory<TSource> {
        const source = this.source;
        const count = this.count;

        return () => {
            return new SkipLastEnumerator<TSource>(source[Symbol.iterator](), count);
        }
    }
}